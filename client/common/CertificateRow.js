// @flow

import React, { type Element as ReactElement } from 'react';

import type { DeathCertificate } from '../types';
import { GRAY_100, CHARLES_BLUE } from './style-constants';

export type Props = {|
  certificate: DeathCertificate,
  borderTop: boolean,
  borderBottom: boolean,
  children?: (ReactElement<*>) => ReactElement<*> | Array<ReactElement<*>>,
|};

const renderCertificate = ({
  firstName,
  lastName,
  deathDate,
  deathYear,
  pending,
}: DeathCertificate) => (
  <div key="certificate" className="certificate-info-box">
    <div className="t--sans certificate-name">
      {firstName} {lastName}
    </div>

    <div className="certificate-subinfo">
      Died: {deathDate || deathYear}
      {pending && ' – Certificate pending'}
    </div>

    <style jsx>{`
      .certificate-info-box {
        flex: 1;
      }

      .certificate-name {
        font-style: normal;
        font-weight: bold;
        letter-spacing: 1.4px;
      }

      .certificate-subinfo {
        color: ${CHARLES_BLUE};
        font-style: italic;
      }
    `}</style>
  </div>
);

// This component takes an optional render prop as its child so that callers can
// construct their own rows. The function is given a <div> component for the
// certificate, and they can return it and other elements.

export default function SearchResult({
  borderTop,
  borderBottom,
  certificate,
  children,
}: Props) {
  let borderClass;

  if (borderTop && borderBottom) {
    borderClass = 'br-a100';
  } else if (borderTop) {
    borderClass = 'br-t100';
  } else if (borderBottom) {
    borderClass = 'br-b100';
  } else {
    borderClass = '';
  }

  return (
    <div className={`p-a300 br b--w row ${borderClass}`}>
      {children
        ? children(renderCertificate(certificate))
        : renderCertificate(certificate)}

      <style jsx>{`
        .row {
          border-color: ${GRAY_100};
          border-left-width: 0;
          border-right-width: 0;

          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
