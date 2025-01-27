import { IconButton, useColorMode } from '@chakra-ui/react'
import { FaSun, FaMoon } from 'react-icons/fa'

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <IconButton
      aria-label="Toggle theme"
      icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
      onClick={toggleColorMode}
      variant="ghost"
      colorScheme={colorMode === 'light' ? 'purple' : 'orange'}
      size="md"
    />
  )
}

export default ThemeToggle
