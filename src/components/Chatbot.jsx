import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Input,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Avatar,
  Collapse,
  Fade,
  CloseButton,
} from '@chakra-ui/react';
import { FaRobot, FaPaperPlane } from 'react-icons/fa';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider ?", isBot: true }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Ajouter le message de l'utilisateur
    setMessages(prev => [...prev, { text: inputMessage, isBot: false }]);
    const userMessage = inputMessage;
    setInputMessage('');

    // Simuler une réponse du bot (à remplacer par une vraie API)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "Je suis désolé, je suis encore en cours de développement. Je ne peux pas encore répondre à vos questions de manière pertinente.",
        isBot: true
      }]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Box position="fixed" bottom="20px" right="20px" zIndex={1000}>
      <Fade in={!isOpen}>
        <IconButton
          icon={<FaRobot />}
          colorScheme="blue"
          rounded="full"
          size="lg"
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
          position="absolute"
          bottom="0"
          right="0"
          boxShadow="lg"
        />
      </Fade>

      <Collapse in={isOpen}>
        <Box
          w="300px"
          h="400px"
          bg={bgColor}
          borderRadius="lg"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          {/* Header */}
          <HStack
            p={3}
            bg="blue.500"
            color="white"
            justify="space-between"
          >
            <HStack>
              <FaRobot />
              <Text fontWeight="bold">Assistant E-matik</Text>
            </HStack>
            <CloseButton onClick={() => setIsOpen(false)} />
          </HStack>

          {/* Messages */}
          <VStack
            h="300px"
            overflowY="auto"
            p={4}
            spacing={4}
            align="stretch"
          >
            {messages.map((message, index) => (
              <HStack
                key={index}
                justify={message.isBot ? 'flex-start' : 'flex-end'}
                align="flex-start"
              >
                {message.isBot && (
                  <Avatar
                    size="sm"
                    icon={<FaRobot />}
                    bg="blue.500"
                    color="white"
                  />
                )}
                <Box
                  maxW="80%"
                  bg={message.isBot ? 'blue.50' : 'blue.500'}
                  color={message.isBot ? 'gray.800' : 'white'}
                  px={3}
                  py={2}
                  borderRadius="lg"
                >
                  <Text fontSize="sm">{message.text}</Text>
                </Box>
                {!message.isBot && (
                  <Avatar
                    size="sm"
                    bg="blue.500"
                  />
                )}
              </HStack>
            ))}
            <div ref={messagesEndRef} />
          </VStack>

          {/* Input */}
          <HStack p={3} borderTop="1px" borderColor={borderColor}>
            <Input
              ref={inputRef}
              placeholder="Tapez votre message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <IconButton
              icon={<FaPaperPlane />}
              colorScheme="blue"
              onClick={handleSendMessage}
              isDisabled={!inputMessage.trim()}
              aria-label="Send message"
            />
          </HStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default Chatbot;
