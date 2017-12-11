// @flow
/* eslint react/no-danger: 0 */
import React from 'react';
import type { DocumentContext } from 'next';
import Document, { Head, Main, NextScript } from 'next/document';

import styleTags from '../client/common/style-tags';

type Props = {
  __NEXT_DATA__: Object,
  cacheParam: string,
};

export default class extends Document {
  props: Props;

  static getInitialProps({ renderPage }: DocumentContext<*>) {
    const page = renderPage();

    // This is set by our standard deployment process.
    const cacheParam =
      (process.env.GIT_REVISION && process.env.GIT_REVISION.substring(0, 8)) ||
      '';

    return { ...page, cacheParam };
  }

  constructor(props: Props) {
    super(props);

    const { __NEXT_DATA__ } = props;

    __NEXT_DATA__.webApiKey = process.env.WEB_API_KEY || 'test-api-key';
    __NEXT_DATA__.stripePublishableKey =
      process.env.STRIPE_PUBLISHABLE_KEY || 'fake-stripe-key';
  }

  render() {
    const { cacheParam } = this.props;

    return (
      <html lang="en" className="js flexbox">
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {styleTags({ cacheParam })}
        </Head>

        <body>
          <Main />

          <script
            src="https://d3tvtfb6518e3e.cloudfront.net/3/opbeat.min.js"
            data-org-id={process.env.OPBEAT_FRONTEND_ORGANIZATION_ID}
            data-app-id={process.env.OPBEAT_FRONTEND_APP_ID}
          />

          <script src="https://js.stripe.com/v3/" />

          <NextScript />
        </body>
      </html>
    );
  }
}
