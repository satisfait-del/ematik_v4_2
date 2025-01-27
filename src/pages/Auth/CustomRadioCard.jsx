import React from 'react';
import { Box, useRadio, Text, VStack, Center } from '@chakra-ui/react';

const CustomRadioCard = (props) => {
  const { option, isSelected, ...radioProps } = props;
  const { getInputProps, getRadioProps } = useRadio(radioProps);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="lg"
        _checked={{
          bg: 'blue.50',
          color: 'blue.600',
          borderColor: 'blue.500',
        }}
        _hover={{
          borderColor: 'blue.500',
        }}
        px={5}
        py={3}
      >
        <VStack spacing={2}>
          <Center
            bg={isSelected ? 'blue.100' : 'gray.100'}
            w="40px"
            h="40px"
            borderRadius="full"
            fontSize="xl"
          >
            {option.icon}
          </Center>
          <Text fontWeight="bold" fontSize="sm">
            {option.title}
          </Text>
          {option.description && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {option.description}
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default CustomRadioCard;
