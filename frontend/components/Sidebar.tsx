import {
  Box,
  VStack,
  Button,
  Text,
  Icon,
  Divider,
  Flex,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiPlus } from 'react-icons/fi';

interface QuerySession {
  id: string;
  query: string;
  timestamp: number;
}

interface SidebarProps {
  sessions: QuerySession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const MotionBox = motion.create(Box);

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  onClose,
}: SidebarProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.900');
  const hoverColor = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.50', 'blue.900');
  const activeTextColor = useColorModeValue('blue.600', 'blue.200');

  const SidebarContent = (
    <Flex
      direction="column"
      h="100%"
      w="100%"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      py={4}
    >
      <Box px={4} mb={6}>
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          w="full"
          onClick={onNewChat}
          size="lg"
          boxShadow="md"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          New Chat
        </Button>
      </Box>

      <Divider mb={4} />

      <VStack align="stretch" spacing={1} overflowY="auto" flex={1} px={2}>
        {sessions.length === 0 && (
          <Text color="gray.500" fontSize="sm" textAlign="center" mt={4}>
            No previous queries
          </Text>
        )}
        {sessions.map((session) => (
          <MotionBox
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              onClick={() => onSelectSession(session.id)}
              bg={currentSessionId === session.id ? activeColor : 'transparent'}
              color={
                currentSessionId === session.id ? activeTextColor : 'inherit'
              }
              _hover={{ bg: hoverColor }}
              leftIcon={<Icon as={FiMessageSquare} />}
              fontWeight={
                currentSessionId === session.id ? 'semibold' : 'normal'
              }
              h="auto"
              py={3}
              whiteSpace="normal"
              textAlign="left"
            >
              <Text noOfLines={2} fontSize="sm">
                {session.query}
              </Text>
            </Button>
          </MotionBox>
        ))}
      </VStack>
    </Flex>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen || false}
        placement="left"
        onClose={onClose || (() => {})}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody p={0}>{SidebarContent}</DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar - Hidden on mobile via CSS */}
      <Box
        w="280px"
        h="calc(100vh - 64px)"
        position="sticky"
        top="64px"
        display={{ base: 'none', md: 'block' }}
      >
        {SidebarContent}
      </Box>
    </>
  );
}
