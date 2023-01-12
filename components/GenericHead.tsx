import Head from 'next/head';

import config from '../config/config.json';

export default function GenericHead() {
    return (
        <Head>
            <title>{config.title}</title>
            {/* Required meta tag in order to allow for raw.githubusercontent.com to be fetched from the browser due to CORS restrictions */}
            <meta http-equiv="Content-Security-Policy" content="script-src 'self' https://raw.githubusercontent.com/ 'unsafe-eval'" />
            <meta name="description" content={config.description} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
    );
}