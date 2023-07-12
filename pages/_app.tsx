import '../styles/globals.css'
import WalletContextProvider from '../components/WalletContextProvider'

function MyApp({ Component, pageProps }) {
  return <WalletContextProvider><Component {...pageProps} /></WalletContextProvider>
}

export default MyApp
