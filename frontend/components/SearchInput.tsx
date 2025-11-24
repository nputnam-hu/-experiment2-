'use client';

import { useState, useEffect } from 'react';
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
  Switch,
} from '@chakra-ui/react';

interface SearchInputProps {
  onSearch: (query: string, k: number) => void;
  isLoading: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  initialQuery?: string;
  k: number;
  setK: (k: number) => void;
}

export default function SearchInput({
  onSearch,
  isLoading,
  showAdvanced,
  setShowAdvanced,
  initialQuery = '',
  k,
  setK,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery);

  // Update internal state when initialQuery prop changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

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

        <FormControl display="flex" alignItems="center">
          <Switch
            id="advanced-settings"
            isChecked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
            mr={2}
          />
          <FormLabel
            htmlFor="advanced-settings"
            mb="0"
            fontSize="sm"
            color="gray.600"
          >
            Expert Mode
          </FormLabel>
        </FormControl>

        {showAdvanced && (
          <FormControl>
            <FormLabel fontSize="sm" color="gray.600">
              Number of citations: {k}
            </FormLabel>
            <Slider
              aria-label="slider-k"
              value={k}
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
        )}
      </VStack>
    </Box>
  );
}
