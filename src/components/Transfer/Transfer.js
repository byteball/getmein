import { Card, Row, Col, Steps, Badge } from "antd";
import { useState, Fragment } from "react";
import useCollapse from 'react-hook-collapse';
import { useRef } from "react";
import moment from "moment";
import { ArrowRightOutlined } from "@ant-design/icons";

import { useWindowSize } from "hooks/useWindowSize";
import { getExplorerLink } from "utils/getExplorerLink";

const { Step } = Steps;

export const getStatusIndex = (status) => {
  return ["sent", "mined", "claimed", "claim_confirmed"].findIndex((s) => s === status);
}

export const Transfer = (t) => {
  console.log('rendering transfer', t)
  const { src_asset, dst_asset, src_network, dst_network, amountIn, amountOut, status, recipient_address, ts, txid, claim_txid } = t;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  const [width] = useWindowSize();
  useCollapse(ref, isOpen);

  const showBadge = (t.status && t.status === "claim_confirmed");

  const Wrapper = showBadge ? Badge.Ribbon : Fragment;
  const wrapperProps = showBadge ? { placement: "start", style: { top: 0 }, text: "Finished" } : {}

  return <Wrapper {...wrapperProps}>
    <Card
      bodyStyle={{ padding: 0 }}
      style={{ marginBottom: 20 }}
    >
      <Row
        gutter="10"
        align="middle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          paddingTop: 24,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 24,
          boxSizing: "border-box",
          cursor: "pointer"
        }}
      >
        <Col
          lg={{ span: 8 }}
          md={{ span: 24 }}
          sm={{ span: 24 }}
          xs={{ span: 24 }}
          style={{ fontSize: 16, paddingBottom: width < 992 ? 20 : 0, paddingTop: width < 992 ? 5 : 0 }}
        >
          <span>{amountIn} {src_asset}<sub>{src_network}</sub></span> <ArrowRightOutlined /> {dst_asset}<sub>{dst_network}</sub>
        </Col>
        <Col
          lg={{ span: 16 }}
          md={{ span: 16 }}
          sm={{ span: 24 }}
          xs={{ span: 24 }}>
          <Steps size="small" labelPlacement={width > 1100 ? "horizontal" : "vertical"} direction={width >= 992 ? "horizontal" : "vertical"} current={getStatusIndex(status)}>
            {
              <>
                <Step title="Sent" />
                <Step title="Mined" />
                <Step title="Claimed" />
                <Step title="Claim confirmed" />
              </>
            }
          </Steps>
        </Col>
      </Row>
      <div ref={ref} style={{ overflow: 'hidden', transition: '0.4s' }}>
        <Row>
          <Col
            lg={12}
            sm={{ span: 24 }}
            xs={{ span: 24 }}
          >
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Recipient address</b>: <div style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}>{recipient_address}</div>
            </div>
          </Col>
          <Col
            lg={6}
            sm={{ span: 24 }}
            xs={{ span: 24 }}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>You get</b>: <div>{amountOut}</div>
            </div>
          </Col>

          <Col lg={6}
            sm={{ span: 24 }}
            xs={{ span: 24 }}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Created</b>: <div>{moment.unix(ts / 1000).format("LLL")}</div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg={12}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Sent in</b>: <div style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}><a href={getExplorerLink(src_network, txid)} target="_blank" rel="noopener">{txid}</a></div>
            </div>
          </Col>
          {claim_txid && <Col lg={12}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Claimed in</b>: <div style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}><a href={getExplorerLink(dst_network, claim_txid)} target="_blank" rel="noopener">{claim_txid}</a></div>
            </div>
          </Col>}
        </Row>
      </div>
    </Card>
  </Wrapper>
}
