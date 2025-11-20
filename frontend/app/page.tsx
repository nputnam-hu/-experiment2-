'use client';

import { useState } from 'react';
import { Box, Container, VStack, Heading, Text } from '@chakra-ui/react';
import HeaderNav from '@/components/HeaderNav';
import SearchInput from '@/components/SearchInput';
import ResultsDisplay from '@/components/ResultsDisplay';
import { queryLaws, QueryResponse } from '@/lib/api';

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string, k: number) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await queryLaws(query, k);
      if (response.status === 'success') {
        setResult(response.data);
      } else {
        setError(response.message || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <HeaderNav signOut={() => {}} />
      
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={10}>
            <Heading as="h1" size="xl" mb={4} color="blue.900">
              Westeros Legal Assistant
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Ask questions about the laws of the Seven Kingdoms
            </Text>
          </Box>

          <Box bg="white" p={6} borderRadius="xl" boxShadow="base">
            <SearchInput onSearch={handleSearch} isLoading={isLoading} />
          </Box>

          <ResultsDisplay result={result} error={error} />
        </VStack>
      </Container>
    </Box>
  );
}
