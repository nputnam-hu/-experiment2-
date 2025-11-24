import { useState } from 'react';
import { HStack, Text, IconButton } from '@chakra-ui/react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryResponse, submitFeedback } from '@/lib/api';

interface FeedbackControlsProps {
  result: QueryResponse;
}

export default function FeedbackControls({ result }: FeedbackControlsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
    null
  );

  const handleFeedback = async (type: 'positive' | 'negative') => {
    // Allow toggling off if clicking the same button
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);

    const feedbackData = {
      feedback: newFeedback,
      result,
      timestamp: new Date().toISOString(),
    };

    console.log('Feedback submitted:', feedbackData);

    try {
      await submitFeedback(feedbackData);
    } catch (err) {
      console.error('Failed to send feedback to backend:', err);
    }
  };

  return (
    <HStack justify="flex-end" spacing={2} h="40px">
      <AnimatePresence mode="wait">
        {feedback ? (
          <motion.div
            key="thank-you"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <Text fontSize="sm" color="green.600" fontWeight="medium" mr={2}>
              Thanks for your feedback!
            </Text>
          </motion.div>
        ) : (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Text fontSize="sm" color="gray.600" mr={2}>
              Was this helpful?
            </Text>
          </motion.div>
        )}
      </AnimatePresence>

      <IconButton
        aria-label="Thumbs up"
        icon={<FaThumbsUp />}
        size="sm"
        colorScheme={feedback === 'positive' ? 'green' : 'blue'}
        variant={feedback === 'positive' ? 'solid' : 'ghost'}
        onClick={() => handleFeedback('positive')}
        as={motion.button}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      />
      <IconButton
        aria-label="Thumbs down"
        icon={<FaThumbsDown />}
        size="sm"
        colorScheme={feedback === 'negative' ? 'red' : 'blue'}
        variant={feedback === 'negative' ? 'solid' : 'ghost'}
        onClick={() => handleFeedback('negative')}
        as={motion.button}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      />
    </HStack>
  );
}
