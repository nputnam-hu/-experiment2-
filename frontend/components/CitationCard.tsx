import { Box, Text, Badge, VStack, Heading } from '@chakra-ui/react';
import { Citation } from '@/lib/api';

interface CitationCardProps {
  citation: Citation;
  index: number;
  onClick?: () => void;
  showAdvanced: boolean;
}

export default function CitationCard({
  citation,
  index,
  onClick,
  showAdvanced,
}: CitationCardProps) {
  return (
    <Box
      as={onClick ? 'button' : 'div'}
      onClick={onClick}
      textAlign="left"
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg="white"
      boxShadow="sm"
      width="100%"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: 'blue.300',
      }}
      cursor={onClick ? 'pointer' : 'default'}
    >
      <VStack align="start" spacing={2}>
        <Box
          display="flex"
          alignItems="baseline"
          width="100%"
          justifyContent="space-between"
        >
          <Badge colorScheme="purple" fontSize="0.8em">
            Citation {index + 1}
          </Badge>
          {showAdvanced && citation.score && (
            <Badge colorScheme={citation.score > 0.8 ? 'green' : 'yellow'}>
              Score: {citation.score.toFixed(2)}
            </Badge>
          )}
        </Box>

        <Heading size="sm" color="gray.700">
          {citation.source}
        </Heading>

        <Text fontSize="sm" color="gray.600" fontStyle="italic">
          &quot;{citation.text}&quot;
        </Text>

        {citation.page && (
          <Text fontSize="xs" color="gray.500">
            Page {citation.page}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
