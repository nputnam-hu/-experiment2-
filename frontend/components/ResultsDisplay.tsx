import { Box, Text, VStack, SimpleGrid, Heading, Divider, Alert, AlertIcon } from '@chakra-ui/react';
import { QueryResponse } from '@/lib/api';
import CitationCard from './CitationCard';

interface ResultsDisplayProps {
  result: QueryResponse | null;
  error: string | null;
}

export default function ResultsDisplay({ result, error }: ResultsDisplayProps) {
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Box bg="blue.50" p={6} borderRadius="lg" borderWidth="1px" borderColor="blue.100">
        <Heading size="md" mb={3} color="blue.800">
          Answer
        </Heading>
        <Text fontSize="lg" color="gray.800">
          {result.response}
        </Text>
      </Box>

      {result.citations.length > 0 && (
        <Box>
          <Heading size="md" mb={4} color="gray.700">
            Sources ({result.citations.length})
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {result.citations.map((citation, index) => (
              <CitationCard key={index} citation={citation} index={index} />
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
}

