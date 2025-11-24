import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Flex,
  Button,
  HStack,
  Link,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Citation } from '@/lib/api';

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
}

export default function PdfViewer({
  isOpen,
  onClose,
  citation,
}: PdfViewerProps) {
  if (!citation) return null;

  const getPdfUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const basePdf = `${baseUrl}/docs/laws.pdf`;

    // Use text fragment for highlighting
    if (citation.text) {
      // Clean text defensively: remove extra spaces
      const cleanText = citation.text.replace(/\s+/g, ' ').trim();

      const words = cleanText.split(' ');
      let fragment = '';

      // If text is long, use start,end format for robustness
      if (words.length > 10) {
        // Encode the start and end phrases
        // Take enough words to be unique but not too many to risk mismatches
        const start = words.slice(0, 5).join(' ');
        const end = words.slice(-5).join(' ');
        fragment = `#:~:text=${encodeURIComponent(start)},${encodeURIComponent(end)}`;
      } else {
        fragment = `#:~:text=${encodeURIComponent(cleanText)}`;
      }

      return `${basePdf}${fragment}`;
    }

    // Fallback to page number if no text available
    return `${basePdf}#page=${citation.page || 1}`;
  };

  const pdfUrl = getPdfUrl();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      isCentered
      motionPreset="slideInBottom"
      preserveScrollBarGap
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent height="90vh" overflow="hidden" bg="white">
        <ModalHeader borderBottomWidth="1px" py={4} bg="gray.50">
          <Flex justify="space-between" align="center" pr={8}>
            <HStack spacing={4}>
              <Text fontWeight="bold" color="blue.800">
                {citation.source}
              </Text>
              {citation.page && (
                <Text fontSize="sm" color="gray.500">
                  Page {citation.page}
                </Text>
              )}
            </HStack>

            <Button
              as={Link}
              href={pdfUrl}
              isExternal
              size="sm"
              rightIcon={<ExternalLinkIcon />}
              variant="ghost"
              colorScheme="blue"
              textDecoration="none"
              _hover={{ textDecoration: 'none', bg: 'blue.50' }}
            >
              Open in New Tab
            </Button>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} bg="gray.200" position="relative">
          {/* 
             Using iframe with Scroll To Text Fragment for highlighting.
             Note: This feature is primarily supported in Chrome-based browsers. More work should be done for other browsers, e.g. Firefox.
           */}
          <Box
            as="iframe"
            src={pdfUrl}
            width="100%"
            height="100%"
            border="none"
            title="Source Document"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
