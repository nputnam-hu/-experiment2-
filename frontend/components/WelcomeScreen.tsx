import { Box, Heading, Text, SimpleGrid, Button } from '@chakra-ui/react';

interface WelcomeScreenProps {
  sampleQuestions: string[];
  onSearch: (query: string, k: number) => void;
  k: number;
}

export default function WelcomeScreen({
  sampleQuestions,
  onSearch,
  k,
}: WelcomeScreenProps) {
  return (
    <Box textAlign="center" py={10}>
      <Heading as="h1" size="xl" mb={4} color="blue.900">
        Westeros Legal Assistant
      </Heading>
      <Text fontSize="lg" color="gray.600" mb={8}>
        Ask questions about the laws of the Seven Kingdoms
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {sampleQuestions.map((q, i) => (
          <Button
            key={i}
            variant="outline"
            h="auto"
            py={4}
            whiteSpace="normal"
            textAlign="left"
            onClick={() => onSearch(q, k)}
            color="gray.600"
            _hover={{
              bg: 'blue.50',
              borderColor: 'blue.500',
              color: 'blue.700',
            }}
          >
            {q}
          </Button>
        ))}
      </SimpleGrid>
    </Box>
  );
}
