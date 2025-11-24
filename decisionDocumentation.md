# Key design choices

- Functional:
    - Separated LLM text response into response_segments. This allows the frontend to easily tag parts of the response to specific citations which enables better UX
    - Added middleware for CORS on the backend for security
    - In addition to standard API fields like status, message, and errors, I added metadata to all API responses which include an API version for future proofing
    - Pre-emptively added user feedback with a binary thumbs-up / thumbs-down which is sent to the backend to enable RLHF or similar post-training techniques while minimizing cognitive burden on the user

- Stylistic:
    - Strict separation of concerns in backend files and frontend components. The separation is especially important for React given how the verbosity of the language and state-management difficulties can make debugging difficult
    - Added support for on-click opening of the laws PDF with the citation highlighted using the text fragments spec 
    - Fixed bug where hovering over the help button in the top right corner caused the scroll bar to appear

# Possible next steps

- Since we are not building "expected to build out a full product," I didn't do everything I would do for a full application. Here are some examples of things I deprioritized:
    - Authentication on the backend / frontend
    - Multiple page views, e.g. home page for the website, adding more PDF documents, functioning navbar buttons
    - Automatic end-to-end type safety by generating frontend types based FastAPI spec (e.g. [generator repo](https://github.com/hey-api/openapi-ts))
    - Backend database to persist queries and user feedback on quality
    - Debugger provider on front-end based on environment variable to test various UI states without calling the backend
    - Unit tests for the backend and frontend
    - Supporting token streaming for backend and frontend
    - User analytics / error logging for product improvement
    - Adding alternative visualization strategies for similarity scores as well as adding a tooltip to help non-expert users interpret them
    - Use a vector DB like Redis since the in-memory Qdrant store means the index is rebuilt on each container restart. 
- Additionally, the document vectorization could be modified for greater robustness and accuracy:
    - Testing different embedding models
    - More sophisticated chunking strategies like using multiple chunk sizes vs. a single 512 size
    - The PDF parsing relies on consistent formatting. Identifying section headers using a LLM generated RegEx or pure LLM parsing could generalize the identifiers to other styles of legal documents
