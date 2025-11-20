'use client';

import { useState } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  FormControl,
  FormLabel,
  HStack,
} from '@chakra-ui/react';

interface SearchInputProps {
  onSearch: (query: string, k: number) => void;
  isLoading: boolean;
}

export default function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [k, setK] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, k);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4} align="stretch">
        <HStack>
          <Input
            placeholder="Ask a question about the laws of Westeros..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="lg"
            bg="white"
            color="black"
          />
          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            isLoading={isLoading}
            loadingText="Searching"
            disabled={!query.trim()}
          >
            Ask
          </Button>
        </HStack>

        <FormControl>
          <FormLabel fontSize="sm" color="gray.600">
            Number of citations (k): {k}
          </FormLabel>
          <Slider
            aria-label="slider-k"
            defaultValue={2}
            min={1}
            max={5}
            step={1}
            onChange={(val) => setK(val)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </FormControl>
      </VStack>
    </Box>
  );
}

