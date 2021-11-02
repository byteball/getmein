import { useEffect, useState, useRef } from "react";
import { Col, Row, Button, Select, Form, Input, Typography, message } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import obyte from "obyte";
import { ethers } from "ethers";
import { transferEVM2Obyte, estimateOutput, csEvents, errors } from "counterstake-sdk";

import { useWindowSize } from "hooks/useWindowSize";
import { Transfer } from "components/Transfer/Transfer";
import { SocialIcons } from "components/SocialIcons/SocialIcons";
import { getCoinIcon } from "utils/getCoinIcon/getCoinIcon";
import { getCdnIconList } from "utils/getCoinIcon/getCdnIconList";
import './App.css';

const { Title, Text } = Typography;

const environment = process.env.REACT_APP_ENVIRONMENT || "mainnet";
const testnet = environment === 'testnet';
const assistant_reward_percent = 1;
const src_network = 'Ethereum';
const dst_network = 'Obyte';

const inputCurrencies = testnet ? ['ETH', 'USDC'] : ['ETH', 'USDC', 'WBTC'];
const outputCurrencies = testnet
  ? ['GBYTE', 'USDC3', 'OUSD_V2', 'ETH3', 'OETHV2']
  : ['GBYTE', 'USDC', 'OUSDV2', 'WBTC', 'OBITV2', 'ETH', 'OETHV2'];
const allowedPairs = {
  ETH: ['GBYTE', 'OETHV2', testnet ? 'ETH3' : 'ETH'],
  USDC: testnet ? ['OUSD_V2', 'USDC3'] : ['GBYTE', 'OUSDV2', 'USDC'],
  WBTC: ['GBYTE', 'OBITV2', 'WBTC'],
};

function getQueryParams() {
  let params = {};
  const query = window.location.search.substring(1);
  const pairs = query.split('&');
  for (let pair of pairs) {
    const [name, value] = pair.split('=');
    params[name] = decodeURIComponent(value);
  }
  return params;
}

function App() {
  const [width] = useWindowSize();
  const [amountIn, setAmountIn] = useState(0.1);
  const [amountOut, setAmountOut] = useState();
  const [inputCurrency, setInputCurrency] = useState('ETH');
  const [outputCurrency, setOutputCurrency] = useState('GBYTE');
  const [recipient, setRecipient] = useState({});
  const [transfer, setTransfer] = useState({});
  const [iconListFromCDN, setIconListFromCDN] = useState([]);

  const transferRef = useRef(null);

  const handleAmountIn = (ev) => {
    const value = ev.target.value;
    const reg = /^[0-9.]+$/;
    if (reg.test(String(value)) || value === "") {
      setAmountIn(value);
    }
  };

  useEffect(() => {
    console.log(`estimate ${amountIn} ${inputCurrency} to ${outputCurrency}`);
    if (!amountIn || isNaN(Number(amountIn))) {
      setAmountOut(undefined);
      return;
    }
    if (!allowedPairs[inputCurrency].includes(outputCurrency)) {
      message.error(`Unsupported pair ${inputCurrency} to ${outputCurrency}`);
      return setOutputCurrency(allowedPairs[inputCurrency][0])
    }
    async function estimate() {
      try {
        const amountOut = await estimateOutput({
          amount: amountIn,
          src_network,
          src_asset: inputCurrency,
          dst_network,
          dst_asset: outputCurrency,
          assistant_reward_percent,
          testnet,
        });
        console.log({ amountOut });
        setAmountOut(amountOut);
      }
      catch (e) {
        setAmountOut(undefined);
        if (e instanceof errors.AmountTooLargeError) {
          console.log('amount too large', e);
          message.error(e.message);
        }
        else if (e instanceof errors.NoBridgeError) {
          console.log('no bridge', e);          
          message.error(e.message);
        }
        else if (e instanceof errors.NoOswapPoolError) {
          console.log('no pool', e);
          message.error(e.message);
        }
        else {
          throw e;
        }
      }
    }
    estimate();
  }, [inputCurrency, outputCurrency, amountIn]);

  useEffect(() => {
    getCdnIconList().then(icons => setIconListFromCDN(icons));
  }, []);

  useEffect(() => {
    console.log('setting claim listener');
    function onNewClaim(claim) {
      console.log('new claim', claim);
      if (claim.txid !== transfer.txid)
        return console.log(`some other claim`);
      transfer.claim_txid = claim.claim_txid;
      transfer.status = claim.is_request ? 'claimed' : 'claim_confirmed';
      setTransfer({ ...transfer });
    }
    csEvents.on('NewClaim', onNewClaim);
    return () => {
      console.log('removing claim listener');
      csEvents.off('NewClaim', onNewClaim);
    };
  }, [transfer]);


  const handleRecipientChange = (value) => {
    const valid = value === '' ? undefined : obyte.utils.isValidAddress(value);
    setRecipient({ value, valid });
  };

  useEffect(() => {
    const { recipient } = getQueryParams();
    if (recipient)
      handleRecipientChange(recipient)
  }, []);

  const handleClickTransfer = async () => {
    let txid;
    try {
      txid = await transferEVM2Obyte({
        amount: amountIn,
        src_network,
        src_asset: inputCurrency,
        dst_network,
        dst_asset: outputCurrency,
        recipient_address: recipient.value,
        assistant_reward_percent,
        //signer,
        testnet,
      });
      console.log('txid', txid);
    }
    catch (e) {
      if (e instanceof errors.NoMetamaskError)
        return message.error("MetaMask not found");
      throw e;
    }
    const transfer = {
      amountIn,
      amountOut,
      src_network,
      src_asset: inputCurrency,
      dst_network,
      dst_asset: outputCurrency,
      recipient_address: recipient.value,
      txid,
      ts: Date.now(),
      status: 'sent',
    };
    setTransfer(transfer);

    let provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.waitForTransaction(txid);
    transfer.status = 'mined';
    console.log('mined');
    setTransfer({ ...transfer });
  };

  return (
    <div className="main_page content">
      <div className="container">
        <div style={{ height: 100, textAlign: "center" }}><img src="/obyte-white-transparent-h100.png" style={{ height: 100 }} alt="Obyte logo" /></div>
        <Title level={1} style={{ fontWeight: "bold", fontSize: width < 768 ? (width < 500 ? 46 : 72) : 72, lineHeight: "79px", textAlign: "center", marginBottom: 0, letterSpacing: "-0.05em", marginTop: width < 768 ? 10 : 20 }}>Get Me Into Obyte</Title>
        <div style={{ position: "relative" }}>
          <Row style={{ marginTop: 70 }}>
            <Col xs={{ span: 24, offset: 0 }} md={{ span: 11 }}>

              <div style={{ marginBottom: 5 }}>
                <Text type="secondary">
                  You <b>send</b> from Ethereum
                </Text>
              </div>

              <Form.Item>
                <Input.Group compact={width > 560}>
                  <Input
                    style={{ width: !width || width > 560 ? "35%" : "100%", fontSize: 18, lineHeight: '25px', marginBottom: width > 560 ? 0 : 15 }}
                    size="large"
                    autoFocus={true}
                    placeholder="Amount"
                    onChange={handleAmountIn}
                    value={isNaN(amountIn) ? undefined : amountIn}
                    onKeyPress={(ev) => {
                      if (ev.key === "Enter") {
                        transferRef.current.click();
                      }
                    }}
                  />
                  <Select
                    style={{ width: !width || width > 560 ? "65%" : "100%", fontSize: 18 }}
                    size="large"
                    placeholder="Input currency"
                    optionFilterProp="label"
                    onChange={val => {
                      setInputCurrency(val);
                      if (!allowedPairs[val].includes(outputCurrency)) {
                        setOutputCurrency(allowedPairs[val][0])
                      }
                    }}
                    value={inputCurrency}
                  >
                    {inputCurrencies.map(currency => (<Select.Option value={currency} key={currency}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div>{getCoinIcon("Ethereum", currency, iconListFromCDN)}</div> <span>{currency}</span>
                      </div>
                    </Select.Option>))}
                  </Select>
                </Input.Group>
              </Form.Item>
            </Col>

            <Col xs={{ span: 24, offset: 0 }} md={{ span: 2, offset: 0 }}>
              <div
                style={{
                  marginTop: width < 768 ? -20 : 37,
                  textAlign: "center",
                  height: 38,
                  boxSizing: "border-box",
                  fontSize: "1.5em",
                }}
              >
                <ArrowRightOutlined/>
              </div>
            </Col>

            <Col xs={{ span: 24, offset: 0 }} md={{ span: 11, offset: 0 }}>
              <div style={{ marginBottom: 5 }}>
                <Text type="secondary">
                  You <b>get</b> on Obyte
                </Text>
              </div>

              <Input.Group compact>
                <Input
                  style={{ width: !width || width > 560 ? "35%" : "100%", marginBottom: width > 560 ? 0 : 15, fontSize: 18, lineHeight: '25px' }}
                  size="large"
                  placeholder="Amount to receive"
                  value={(isNaN(amountOut) || amountOut < 0) ? undefined : amountOut}
                  disabled={true}
                />
                <Select
                  style={{ width: !width || width > 560 ? "65%" : "100%", fontSize: 18 }}
                  size="large"
                  placeholder="Token to receive"
                  onChange={val => {
                    setOutputCurrency(val);
                  }}
                  value={outputCurrency}
                  optionFilterProp="label"
                >
                  {outputCurrencies.map(currency => <Select.Option value={currency} key={currency}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div>{getCoinIcon("Obyte", currency, iconListFromCDN)}</div> <span>{currency}</span>
                    </div>
                  </Select.Option>)}
                </Select>
              </Input.Group>
              <Form.Item
                hasFeedback
                style={{ width: "100%", marginTop: 20 }}
                extra={
                  <span>
                    <a
                      href="https://obyte.org/#download"
                      target="_blank"
                      rel="noopener"
                    >
                      Install Obyte wallet
                    </a> {" "}
                    if you don't have one yet, and copy/paste your address here.
                  </span>
                }
                validateStatus={
                  recipient.valid !== undefined
                    ? recipient.valid
                      ? "success"
                      : "error"
                    : undefined
                }
              >
                <Input
                  size="middle"
                  style={{ height: 45, paddingRight: 30 }}
                  spellCheck="false"
                  value={recipient.value}
                  placeholder="Your Obyte wallet address"
                  onChange={(ev) => handleRecipientChange(ev.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="center">
            <Button
              type="primary"
              size="large"
              ref={transferRef}
              key="btn-transfer"
              disabled={
                !recipient.valid ||
                !amountIn ||
                !(amountOut > 0)
              }
              onClick={() => { handleClickTransfer() }}
            >
              Transfer
            </Button>
          </Row>
        </div>


      </div>

      {Object.keys(transfer).length > 0 && <div className="container container_big">
        <Title style={{ marginTop: 50, marginBottom: 20 }} level={2}>
          Transfer status
        </Title>
        <Transfer {...transfer} />
      </div>}

      <div style={{ marginTop: 60 }}>
        <SocialIcons centered />
        <div style={{ textAlign: "center", marginTop: 10 }}>
          Powered by <a href="https://counterstake.org" target="_blank" rel="noopener">Counterstake Bridge</a>
        </div>
        <div style={{ textAlign: "center", marginTop: 5, paddingBottom: 20 }}>
          &copy; <a href="https://obyte.org" target="_blank" rel="noopener" style={{ color: "#fff" }}>Obyte</a>
        </div>
      </div>
    </div>
  );
}

export default App;
