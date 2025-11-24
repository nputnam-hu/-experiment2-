'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Flex,
  useDisclosure,
  IconButton,
  useBreakpointValue,
  Button,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useMutation } from '@tanstack/react-query';
import HeaderNav from '@/components/HeaderNav';
import SearchInput from '@/components/SearchInput';
import ResultsDisplay from '@/components/ResultsDisplay';
import Sidebar from '@/components/Sidebar';
import WelcomeScreen from '@/components/WelcomeScreen';
import { queryLaws, QueryResponse } from '@/lib/api';

interface Session {
  id: string;
  query: string;
  result: QueryResponse | null;
  error: string | null;
  timestamp: number;
  isLoading?: boolean;
}

const SAMPLE_QUESTIONS = [
  'What are the laws regarding succession?',
  'What is the punishment for stealing?',
  'Can a noble refuse a summons from the King?',
  "What are the duties of the Night's Watch?",
];

export default function Page() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [k, setK] = useState(2);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const queryLawsMutation = useMutation({
    mutationFn: ({ query, k }: { query: string; k: number }) =>
      queryLaws(query, k),
  });

  const handleSearch = (query: string, k: number) => {
    const tempId = Date.now().toString();
    const newSession: Session = {
      id: tempId,
      query,
      result: null,
      error: null,
      timestamp: Date.now(),
      isLoading: true,
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(tempId);

    queryLawsMutation.mutate(
      { query, k },
      {
        onSuccess: (data) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === tempId
                ? { ...s, result: data.data, isLoading: false }
                : s
            )
          );
        },
        onError: (error) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === tempId
                ? {
                    ...s,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'An error occurred',
                    isLoading: false,
                  }
                : s
            )
          );
        },
      }
    );
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    queryLawsMutation.reset();
    if (isMobile) onClose();
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    if (isMobile) onClose();
  };

  // Determine what to display
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const result = currentSession?.result || null;
  const error = currentSession?.error || null;
  const isLoading = currentSession?.isLoading || false;

  return (
    <Box minH="100vh" bg="gray.50">
      <HeaderNav signOut={() => {}} />

      <Flex h="calc(100vh - 65px)">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          isOpen={isOpen}
          onClose={onClose}
        />

        <Box flex="1" overflowY="auto" position="relative">
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            position="absolute"
            top={4}
            left={4}
            zIndex={10}
            onClick={onOpen}
            variant="ghost"
            display={{ base: 'inline-flex', md: 'none' }}
          />

          <Container maxW="container.lg" py={8}>
            <VStack spacing={8} align="stretch">
              {!currentSessionId && (
                <WelcomeScreen
                  sampleQuestions={SAMPLE_QUESTIONS}
                  onSearch={handleSearch}
                  k={k}
                />
              )}

              <Box bg="white" p={6} borderRadius="xl" boxShadow="base">
                <SearchInput
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  showAdvanced={showAdvanced}
                  setShowAdvanced={setShowAdvanced}
                  initialQuery={currentSession?.query || ''}
                  k={k}
                  setK={setK}
                />
              </Box>

              <ResultsDisplay
                result={result}
                error={error}
                showAdvanced={showAdvanced}
                isLoading={isLoading}
              />
            </VStack>
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}
