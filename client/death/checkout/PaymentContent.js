// @flow

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import type Cart from '../../store/Cart';
import type Order, { OrderInfo } from '../../models/Order';
import { makeStateSelectOptions } from '../../common/form-elements';

import OrderDetails from './OrderDetails';
import {
  CHARLES_BLUE,
  GRAY_300,
  LORA_SRC,
  FREEDOM_RED,
} from '../../common/style-constants';

export type Props = {|
  submit: (cardElement: ?StripeElement) => mixed,
  stripe: ?StripeInstance,
  cart: Cart,
  order: Order,
  showErrorsForTest?: boolean,
|};

type State = {
  touchedFields: { [$Keys<OrderInfo>]: boolean },
};

@observer
export default class PaymentContent extends React.Component<Props, State> {
  state: State = {
    touchedFields: {},
  };

  cardElement: ?StripeElement = null;

  componentWillMount() {
    const { stripe, order, showErrorsForTest } = this.props;

    // If someone comes back to this page we need to clear out the credit card
    // info.
    if (!showErrorsForTest) {
      order.resetCard();
    }

    if (stripe) {
      const elements = stripe.elements({
        fonts: [
          {
            family: 'Lora',
            src: `url('${LORA_SRC}')`,
          },
        ],
      });

      this.cardElement = elements.create('card', {
        hidePostalCode: true,
        classes: {
          base: 'txt-f',
          invalid: 'txt-f--err',
        },
        style: {
          base: {
            lineHeight: '3.5rem',
            fontFamily: 'Lora, Impact, fixed',
            fontSize: '16px',
            color: CHARLES_BLUE,
          },
          empty: {
            color: GRAY_300,
          },
          invalid: {
            color: FREEDOM_RED,
          },
        },
      });

      this.cardElement.on('change', this.handleCardElementChange);
    }
  }

  componentWillUnmount() {
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }

  setCardField = (el: ?HTMLElement) => {
    if (this.cardElement) {
      if (el) {
        this.cardElement.mount(el);
      } else {
        this.cardElement.unmount();
      }
    }
  };

  handleCardElementChange = action((ev: StripeElementChangeEvent) => {
    const { order } = this.props;
    if (ev.error) {
      order.cardElementError = ev.error.message;
      order.cardElementComplete = false;
    } else {
      order.cardElementError = null;
      order.cardElementComplete = ev.complete;
    }
  });

  handleSubmit = (ev: SyntheticInputEvent<*>) => {
    ev.preventDefault();

    const { submit } = this.props;
    submit(this.cardElement);
  };

  fieldListeners(fieldName: $Keys<OrderInfo>) {
    return {
      onBlur: action(`onBlur ${fieldName}`, () => {
        const { touchedFields } = this.state;

        this.setState({
          touchedFields: { ...touchedFields, [fieldName]: true },
        });
      }),

      onChange: action(
        `onChange ${fieldName}`,
        (ev: SyntheticInputEvent<*>) => {
          const { order } = this.props;

          if (
            fieldName === 'storeContactAndShipping' ||
            fieldName === 'storeBilling'
          ) {
            order.info[fieldName] = ev.target.checked;
          } else if (fieldName === 'billingAddressSameAsShippingAddress') {
            order.info[fieldName] = ev.target.value === 'true';
          } else {
            order.info[fieldName] = ev.target.value;
          }
        }
      ),
    };
  }

  errorForField(fieldName: $Keys<OrderInfo>): ?string {
    const { order, showErrorsForTest } = this.props;
    const { touchedFields } = this.state;

    const errors = order.paymentErrors[fieldName];

    return (touchedFields[fieldName] || showErrorsForTest) &&
      errors &&
      errors[0]
      ? errors[0]
      : null;
  }

  render() {
    const { cart, order } = this.props;

    const {
      paymentIsComplete,
      cardElementError,
      cardElementComplete,
      processing,
      processingError,
      info: {
        storeBilling,
        shippingAddress1,
        shippingAddress2,
        shippingCity,
        shippingState,
        shippingZip,
        cardholderName,
        billingAddressSameAsShippingAddress,
        billingAddress1,
        billingAddress2,
        billingCity,
        billingState,
        billingZip,
      },
    } = order;

    return (
      <div>
        <Head>
          <title>Boston.gov — Death Certificate Payment</title>
        </Head>

        <div className="p-a300">
          <div className="sh sh--b0 m-t300" style={{ paddingBottom: 0 }}>
            <h1 className="sh-title" style={{ marginBottom: 0 }}>
              Payment
            </h1>
          </div>
        </div>

        <OrderDetails cart={cart} />

        <form
          className="m-v300"
          acceptCharset="UTF-8"
          method="post"
          onSubmit={this.handleSubmit}
        >
          <div className="b--w p-a300 field-container">
            <fieldset>
              <legend className="m-b300">
                <span className="stp" style={{ display: 'inline-block' }}>
                  Shipping Address
                </span>{' '}
                —{' '}
                <Link href="/death/checkout?page=shipping" as="/death/checkout">
                  <a style={{ fontStyle: 'italic' }}>edit</a>
                </Link>
              </legend>
              {`${shippingAddress1}${shippingAddress2
                ? `, ${shippingAddress2}`
                : ''}, ${shippingCity} ${shippingState} ${shippingZip}`}
            </fieldset>
          </div>

          <div className="b--w p-a300 field-container">
            <fieldset>
              <legend className="stp m-b300">Payment method</legend>

              <div className="txt">
                <label htmlFor="card-name" className="txt-l txt-l--mt000">
                  Cardholder Name <span className="t--req">Required</span>
                </label>

                <input
                  id="card-name"
                  name="card-name"
                  type="text"
                  {...this.fieldListeners('cardholderName')}
                  value={cardholderName}
                  placeholder="Cardholder Name"
                  className={`txt-f ${this.renderErrorClassName(
                    'cardholderName'
                  )}`}
                />

                {this.renderError('cardholderName')}
              </div>

              <div className="txt">
                <label htmlFor="card-number" className="txt-l txt-l--mt000">
                  Credit or Debit Card <span className="t--req">Required</span>
                </label>

                <div ref={this.setCardField} />
                {cardElementError && (
                  <div className="t--subinfo t--err m-t100">
                    {cardElementError}
                  </div>
                )}

                <div className="m-t100 t--subinfo">
                  We accept Visa, MasterCard, and Discover.
                </div>
              </div>
            </fieldset>
          </div>

          <div className="b--w p-a300 field-container">
            <fieldset>
              <legend className="stp m-b300">Billing Address</legend>

              <div>
                <label className="ra">
                  <input
                    type="radio"
                    name="billing-address-same-as-shipping-address"
                    {...this.fieldListeners(
                      'billingAddressSameAsShippingAddress'
                    )}
                    value="true"
                    className="ra-f"
                    checked={billingAddressSameAsShippingAddress}
                  />
                  <span className="ra-l">Same as shipping address</span>
                </label>

                <label className="ra">
                  <input
                    type="radio"
                    name="billing-address-same-as-shipping-address"
                    {...this.fieldListeners(
                      'billingAddressSameAsShippingAddress'
                    )}
                    value="false"
                    className="ra-f"
                    checked={!billingAddressSameAsShippingAddress}
                  />
                  <span className="ra-l">Use a different address</span>
                </label>
              </div>

              {!billingAddressSameAsShippingAddress && (
                <div className="m-t500">
                  <div className="txt">
                    <label
                      htmlFor="billing-address-1"
                      className="txt-l txt-l--mt000"
                    >
                      Address Line 1 <span className="t--req">Required</span>
                    </label>
                    <input
                      id="billing-address-1"
                      name="billing-address-1"
                      {...this.fieldListeners('billingAddress1')}
                      type="text"
                      placeholder="Address Line 1"
                      className={`txt-f ${this.renderErrorClassName(
                        'billingAddress1'
                      )}`}
                      value={billingAddress1}
                    />

                    {this.renderError('billingAddress1')}
                  </div>

                  <div className="txt">
                    <label
                      htmlFor="billing-address-2"
                      className="txt-l txt-l--mt000"
                    >
                      Address Line 2 (optional)
                    </label>
                    <input
                      id="billing-address-2"
                      name="billing-address-2"
                      {...this.fieldListeners('billingAddress2')}
                      type="text"
                      placeholder="Address Line 2"
                      className={`txt-f ${this.renderErrorClassName(
                        'billingAddress2'
                      )}`}
                      value={billingAddress2}
                    />

                    {this.renderError('billingAddress2')}
                  </div>

                  <div className="txt">
                    <label
                      htmlFor="billing-city"
                      className="txt-l txt-l--mt000"
                    >
                      City <span className="t--req">Required</span>
                    </label>
                    <input
                      id="billing-city"
                      name="billing-city"
                      {...this.fieldListeners('billingCity')}
                      type="text"
                      placeholder="City"
                      className={`txt-f ${this.renderErrorClassName(
                        'billingCity'
                      )}`}
                      value={billingCity}
                    />

                    {this.renderError('billingCity')}
                  </div>

                  {/* Adding "txt" so that we get the bottom margin right. */}
                  <div className="sel txt">
                    <label
                      htmlFor="billing-state"
                      className="sel-l txt-l--mt000"
                    >
                      State / Territory <span className="t--req">Required</span>
                    </label>
                    <div className="sel-c">
                      <select
                        id="billing-state"
                        name="billing-state"
                        {...this.fieldListeners('billingState')}
                        className={`sel-f ${this.renderErrorClassName(
                          'billingState'
                        )}`}
                        value={billingState}
                      >
                        {makeStateSelectOptions()}
                      </select>
                    </div>

                    {this.renderError('billingState')}
                  </div>

                  <div className="txt">
                    <label htmlFor="billing-zip" className="txt-l txt-l--mt000">
                      ZIP Code <span className="t--req">Required</span>
                    </label>
                    <input
                      id="billing-zip"
                      name="billing-zip"
                      {...this.fieldListeners('billingZip')}
                      placeholder="ZIP code"
                      className={`txt-f txt-f--50 ${this.renderErrorClassName(
                        'billingZip'
                      )}`}
                      value={billingZip}
                    />

                    {this.renderError('billingZip')}
                  </div>

                  <div className="m-t300 field-container">
                    <label className="cb">
                      <input
                        id="store-billing"
                        name="store-billing"
                        type="checkbox"
                        value="true"
                        checked={storeBilling}
                        {...this.fieldListeners('storeBilling')}
                        className="cb-f"
                      />{' '}
                      <span className="cb-l">
                        Save billing address on this computer
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </fieldset>
          </div>

          <div className="g p-a300">
            {processingError && (
              <div className="g--9 t--subinfo t--err m-t300">
                {processingError}
              </div>
            )}
          </div>

          <div className="g g--r p-a300 b--w">
            <button
              className="g--3 btn m-v500"
              type="submit"
              disabled={
                !paymentIsComplete || !cardElementComplete || processing
              }
            >
              Next: Review Order
            </button>

            <div className="g--9 m-v500">
              <Link href="/death/checkout?page=shipping" as="/death/checkout">
                <a style={{ fontStyle: 'italic' }}>
                  ← Back to shipping information
                </a>
              </Link>
            </div>
          </div>

          <style jsx>{`
            button {
              align-self: center;
            }
            fieldset {
              border: 0;
              padding: 0.01em 0 0 0;
              margin: 0;
              min-width: 0;
            }
            legend {
              padding: 0;
              display: table;
            }
            .txt-l,
            .sel-l {
              font-weight: normal;
              font-size: 12px;
            }
            .txt-f--100 {
              width: 100%;
            }
            .txt-f--50 {
              width: 50%;
            }
            .field-container {
              margin-bottom: 2px;
            }
          `}</style>
        </form>
      </div>
    );
  }

  renderError(fieldName: $Keys<OrderInfo>) {
    const error = this.errorForField(fieldName);
    return error && <div className="t--subinfo t--err m-t100">{error}</div>;
  }

  renderErrorClassName(fieldName: $Keys<OrderInfo>) {
    const error = this.errorForField(fieldName);
    return error ? 'txt-f--err' : '';
  }
}
