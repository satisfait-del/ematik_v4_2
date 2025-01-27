import {
  Center,
  VStack,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'

const LoadingSpinner = ({ message = "Chargement..." }) => {
  const spinnerColor = useColorModeValue('blue.500', 'blue.200')
  const textColor = useColorModeValue('gray.600', 'gray.200')

  return (
    <Center minH="50vh">
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor={useColorModeValue('gray.200', 'gray.700')}
          color={spinnerColor}
          size="xl"
        />
        <Text color={textColor}>{message}</Text>
      </VStack>
    </Center>
  )
}

export default LoadingSpinner
