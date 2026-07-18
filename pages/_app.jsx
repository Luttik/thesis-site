import "../styles/main.scss";
import "../styles/prism.scss";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import NavigationLoader from "../components/NavigationLoader";

export default function App({ Component, pageProps }) {
    return (
        <>
            <NavigationLoader />
            <Component {...pageProps} />
            <Analytics />
        </>
    );
}
