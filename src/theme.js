import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const colors = {
  brand: {
    50: '#E5F0FF',
    100: '#B8D5FF',
    200: '#8ABBFF',
    300: '#5CA0FF',
    400: '#2E86FF',
    500: '#006CFF',
    600: '#0056CC',
    700: '#004099',
    800: '#002B66',
    900: '#001533',
  },
}

const theme = extendTheme({
  config,
  colors,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
})

export default theme
