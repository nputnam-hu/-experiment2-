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
  FormControl,
  FormLabel,
  HStack,
  Switch,
  InputGroup,
  InputRightElement,
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
          <InputGroup size="lg">
            <Input
              placeholder="Ask a question about the laws of Westeros..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg="white"
              color="black"
              pr="8.5rem"
            />
            <InputRightElement width="8rem">
              <FormControl display="flex" alignItems="center" mb={0} justifyContent="flex-end" mr={2}>
                <FormLabel
                  htmlFor="expert-mode-switch"
                  mb="0"
                  fontSize="xs"
                  color="gray.500"
                  mr={2}
                  cursor="pointer"
                >
                  Expert Mode
                </FormLabel>
                <Switch
                  id="expert-mode-switch"
                  size="sm"
                  isChecked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                />
              </FormControl>
            </InputRightElement>
          </InputGroup>
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
