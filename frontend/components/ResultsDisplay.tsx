import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  Skeleton,
  SkeletonText,
  Tooltip,
} from '@chakra-ui/react';
import { QueryResponse, Citation } from '@/lib/api';
import CitationCard from './CitationCard';
import PdfViewer from './PdfViewer';
import FeedbackControls from './FeedbackControls';

interface ResultsDisplayProps {
  result: QueryResponse | null;
  error: string | null;
  showAdvanced: boolean;
  isLoading?: boolean;
}

export default function ResultsDisplay({
  result,
  error,
  showAdvanced,
  isLoading = false,
}: ResultsDisplayProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  useEffect(() => {
    // Reset citation modal when result changes
    if (result) {
      setSelectedCitation(null);
      onClose();
    }
  }, [result]);

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
    onOpen();
  };

  // Parse text to replace [n] with clickable links
  const renderResponse = () => {
    if (!result) return null;

    // Use response_segments if available
    if (result.response_segments) {
      return result.response_segments.map((segment, i) => {
        if (
          segment.citation_index !== undefined &&
          segment.citation_index !== null
        ) {
          const citation = result.citations[segment.citation_index];
          if (citation) {
            return (
              <Tooltip
                key={i}
                label={`Source: ${citation.source}. Click to view details.`}
                aria-label="Citation tooltip"
              >
                <Text
                  as="span"
                  color="blue.600"
                  fontWeight="bold"
                  cursor="pointer"
                  verticalAlign="super"
                  fontSize="sm"
                  mx={0.5}
                  _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                  onClick={() => handleCitationClick(citation)}
                >
                  [{segment.citation_index + 1}]
                </Text>
              </Tooltip>
            );
          }
        }
        return <span key={i}>{segment.text}</span>;
      });
    }

    // Fallback parsing (legacy)
    const parts = result.response.split(/(\[\d+\])/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const index = parseInt(match[1]) - 1;
        const citation = result.citations[index];
        if (citation) {
          return (
            <Tooltip
              key={i}
              label={`Source: ${citation.source}. Click to view details.`}
              aria-label="Citation tooltip"
            >
              <Text
                as="span"
                color="blue.600"
                fontWeight="bold"
                cursor="pointer"
                verticalAlign="super"
                fontSize="sm"
                mx={0.5}
                _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                onClick={() => handleCitationClick(citation)}
              >
                [{index + 1}]
              </Text>
            </Tooltip>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <VStack spacing={6} align="stretch" w="100%">
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Skeleton height="24px" width="150px" mb={4} />
          <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />
        </Box>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Skeleton height="100px" borderRadius="md" />
          <Skeleton height="100px" borderRadius="md" />
        </SimpleGrid>
      </VStack>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Box
        bg="blue.50"
        p={6}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="blue.100"
      >
        <Heading size="md" mb={3} color="blue.800">
          Answer
        </Heading>
        <Text fontSize="lg" color="gray.800" mb={4} lineHeight="tall">
          {renderResponse()}
        </Text>

        <Divider borderColor="blue.200" mb={3} />

        <FeedbackControls result={result} />
      </Box>

      {result.citations.length > 0 && (
        <Box>
          <Heading size="md" mb={4} color="gray.700">
            Sources ({result.citations.length})
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {result.citations.map((citation, index) => (
              <CitationCard
                key={index}
                citation={citation}
                index={index}
                onClick={() => handleCitationClick(citation)}
                showAdvanced={showAdvanced}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}

      <PdfViewer
        isOpen={isOpen}
        onClose={onClose}
        citation={selectedCitation}
      />
    </VStack>
  );
}
