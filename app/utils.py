from dotenv import load_dotenv
import os
import warnings

# Load environment variables from .env file if it exists
load_dotenv()

# Suppress Qdrant payload index warning for in-memory client
warnings.filterwarnings(
    "ignore",
    message="Payload indexes have no effect in the local Qdrant",
    category=UserWarning,
    module="llama_index.vector_stores.qdrant.base"
)

from pydantic import BaseModel
import qdrant_client
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.schema import Document, TextNode
from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    Settings,
)
from llama_index.core.query_engine import CitationQueryEngine
from dataclasses import dataclass
import pdfplumber
import re
from pathlib import Path
from typing import Optional
from types import MethodType

key = os.getenv('OPENAI_API_KEY')
if not key:
    raise ValueError(
        "OPENAI_API_KEY environment variable is not set. "
        "Please set it in your environment or create a .env file with OPENAI_API_KEY=your_key"
    )

@dataclass
class Input:
    query: str
    file_path: str

class Citation(BaseModel):
    source: str
    text: str
    page: Optional[int] = None
    score: Optional[float] = None

class TextSegment(BaseModel):
    text: str
    citation_index: Optional[int] = None
    citation_text: Optional[str] = None

class Output(BaseModel):
    query: str
    response: str
    response_segments: list[TextSegment]
    citations: list[Citation]

class DocumentService:
    def __init__(self, pdf_path: str = "docs/laws.pdf"):
        self.pdf_path = pdf_path
    
    def create_documents(self) -> list[Document]:
        """
        Parse the PDF and extract laws into Document objects with metadata.
        Each law section/subsection becomes a Document with metadata including:
        - section_id: e.g., "5"
        - subsection_id: e.g., "5.1.1"
        - section_name: e.g., "Trials by combat"
        - page: page number in PDF
        """
        docs = []
        
        with pdfplumber.open(self.pdf_path) as pdf:
            current_section_id = None
            current_section_name = None
            current_text = []
            current_page = None
            
            # Pattern to match section headers like "5", "5.1", "5.1.1"
            section_pattern = re.compile(r'^(\d+(?:\.\d+)*)\.?\s*(.*?)$')
            # Pattern to match subsection headers
            subsection_pattern = re.compile(r'^(\d+(?:\.\d+)+)\s+(.+)$')
            
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if not text:
                    continue
                
                lines = text.split('\n')
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check if this is a section header (starts with number)
                    section_match = section_pattern.match(line)
                    if section_match:
                        # Save previous section if exists
                        if current_text and current_section_id:
                            doc_text = '\n'.join(current_text).strip()
                            if doc_text:
                                docs.append(Document(
                                    text=doc_text,
                                    metadata={
                                        "section_id": current_section_id,
                                        "section_name": current_section_name or f"Section {current_section_id}",
                                        "page": current_page or page_num
                                    }
                                ))
                        
                        # Start new section
                        current_section_id = section_match.group(1)
                        text_part = section_match.group(2).strip()
                        
                        # Determine if the text part is a title or content
                        # Heuristic: Titles are short and typically don't end with a period (unless it's a single word/phrase).
                        # Long text or text ending in period is likely content.
                        is_likely_title = len(text_part) < 60 and not text_part.endswith('.')
                        
                        if is_likely_title and text_part:
                            current_section_name = text_part
                        else:
                            current_section_name = f"Section {current_section_id}"
                        
                        current_text = [text_part] if text_part else []
                        current_page = page_num
                    else:
                        # Continuation of current section
                        if current_section_id:
                            current_text.append(line)
            
            # Save last section
            if current_text and current_section_id:
                doc_text = '\n'.join(current_text).strip()
                if doc_text:
                    docs.append(Document(
                        text=doc_text,
                        metadata={
                            "section_id": current_section_id,
                            "section_name": current_section_name or f"Section {current_section_id}",
                            "page": current_page or len(pdf.pages)
                        }
                    ))
        
        # Post-process: ensure section_name is populated from parent if missing
        section_name_map = {}
        for doc in docs:
            section_id = doc.metadata.get("section_id")
            section_name = doc.metadata.get("section_name")
            
            if section_id and section_name and not section_name.startswith("Section"):
                section_name_map[section_id] = section_name
        
        # Fill in missing section names from parent sections
        for doc in docs:
            if not doc.metadata.get("section_name") or doc.metadata.get("section_name", "").startswith("Section"):
                section_id = doc.metadata.get("section_id")
                
                if section_id and section_id in section_name_map:
                    doc.metadata["section_name"] = section_name_map[section_id]
        
        return docs

class QdrantService:
    def __init__(self, k: int = 2):
        self.index = None
        self.k = k
    
    def connect(self) -> None:
        client = qdrant_client.QdrantClient(location=":memory:")

        if not hasattr(client, "search") and hasattr(client, "query_points"):
            def _search(self, collection_name: str, query_vector, limit: int, query_filter=None, **kwargs):
                response = self.query_points(
                    collection_name=collection_name,
                    query=query_vector,
                    limit=limit,
                    query_filter=query_filter,
                    with_payload=True,
                    **kwargs,
                )
                return response.points
            client.search = MethodType(_search, client)

        vstore = QdrantVectorStore(client=client, collection_name='temp')

        # Configure embedding model and LLM
        embed_model = OpenAIEmbedding(api_key=key)
        llm = OpenAI(api_key=key, model="gpt-4o-mini")
        
        # Set global settings
        Settings.embed_model = embed_model
        Settings.llm = llm

        storage_context = StorageContext.from_defaults(vector_store=vstore)
        self.index = VectorStoreIndex.from_vector_store(
            vector_store=vstore,
            storage_context=storage_context,
            embed_model=embed_model
        )

    def load(self, docs: Optional[list[Document]] = None):
        """
        Load documents into the index. If docs is None, create documents from PDF.
        """
        if docs is None:
            doc_service = DocumentService()
            docs = doc_service.create_documents()
        
        # Convert Documents to Nodes for insertion
        nodes = []
        for doc in docs:
            node = TextNode(
                text=doc.text,
                metadata=doc.metadata
            )
            nodes.append(node)
        
        self.index.insert_nodes(nodes)
    
    def query(self, query_str: str) -> Output:
        """
        Query the index using CitationQueryEngine and return formatted Output.
        """
        if self.index is None:
            raise ValueError("Index not initialized. Call connect() first.")
        
        # Initialize CitationQueryEngine with similarity_top_k = self.k
        query_engine = CitationQueryEngine.from_args(
            self.index,
            similarity_top_k=self.k,
            citation_chunk_size=512
        )
        
        # Run the query
        response = query_engine.query(query_str)
        
        # Extract citations from source nodes
        citations = []
        if hasattr(response, 'source_nodes') and response.source_nodes:
            for node in response.source_nodes:
                # Handle NodeWithScore objects from LlamaIndex
                actual_node = node.node if hasattr(node, 'node') else node
                score = node.score if hasattr(node, 'score') else None
                
                metadata = actual_node.metadata if hasattr(actual_node, 'metadata') else {}
                node_text = actual_node.text if hasattr(actual_node, 'text') else str(actual_node)
                node_text = re.sub(r'^Source \d+:\s*', '', node_text)
                node_text = node_text.replace('\n', ' ').strip()
                
                # Extract metadata fields
                section_id = metadata.get('section_id')
                page = metadata.get('page')
                
                # Format source as "Section X" to be a valid RAG source
                source = f"Section {section_id}" if section_id else "Unknown"
                
                citations.append(Citation(
                    source=source,
                    text=node_text,
                    page=page,
                    score=score
                ))
        
        # Get response text (avoid default Source 1/2 prefixes if possible)
        if response is None:
            response_text = ""
        else:
            response_text = getattr(response, "response", None) or str(response)
        
        # Parse response text into segments
        response_segments = []
        # Split by citation markers like [1], [2]
        parts = re.split(r'(\[\d+\])', response_text)
        
        for part in parts:
            if not part:
                continue
            
            citation_match = re.match(r'^\[(\d+)\]$', part)
            if citation_match:
                citation_num = int(citation_match.group(1))
                # Validate if this citation number exists in our citations list
                # LlamaIndex uses 1-based indexing for citations in text
                citation_index = citation_num - 1
                
                if 0 <= citation_index < len(citations):
                    # It's a valid citation
                    response_segments.append(TextSegment(
                        text=part,
                        citation_index=citation_index,
                        citation_text=citations[citation_index].source
                    ))
                else:
                    # It's text that looks like a citation but index is out of bounds
                    response_segments.append(TextSegment(text=part))
            else:
                # Regular text
                response_segments.append(TextSegment(text=part))

        return Output(
            query=query_str,
            response=response_text,
            response_segments=response_segments,
            citations=citations
        )
       

if __name__ == "__main__":
    # Example workflow
    doc_serivce = DocumentService()
    docs = doc_serivce.create_documents()

    index = QdrantService()
    index.connect()
    index.load()

    import json

    result1 = index.query("what happens if I steal?")
    print(json.dumps(result1.model_dump(), indent=2, ensure_ascii=False))
    
    result2 = index.query("How does justice work?")
    print(json.dumps(result2.model_dump(), indent=2, ensure_ascii=False))




