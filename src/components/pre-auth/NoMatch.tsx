// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Card, Divider, Typography } from 'antd';
import { DislikeFilled, DislikeOutlined, LikeFilled, LikeOutlined } from '@ant-design/icons';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import PreAuthLayout from './PreAuthLayout';

import { IQuoteType, quotes } from './quotes';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

interface IState {
  likes: number;
  dislikes: number;
  action: any;
  intercomOpen: boolean;
  quote: IQuoteType;
}

class NoMatch extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      likes: 0,
      dislikes: 0,
      action: null,
      intercomOpen: false,
      quote: quotes[Math.floor(Math.random() * quotes.length)],
    };
  }

  public logMessage = (message: string) => {
    const payload = {
      message,
      url: window.location.href,
    };

    // Logs to server
    fetch(`${process.env.REACT_APP_API_URL}/logs/logHappiness/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          return Promise.reject(res.status);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  public like = () => {
    const message = `:+1: ${this.state.quote.author}`;
    this.logMessage(message);
    this.setState({
      likes: 1,
      dislikes: 0,
      action: 'liked',
    });
  };

  public dislike = () => {
    const message = `:-1: ${this.state.quote.author}`;
    this.logMessage(message);
    this.setState({
      likes: 0,
      dislikes: 1,
      action: 'disliked',
    });
  };

  public openIntercom = () => {
    if (this.state.intercomOpen) {
      (window as any).Intercom('hide');
    } else {
      (window as any).Intercom('show');
    }
    this.setState({ intercomOpen: !this.state.intercomOpen });
  };

  public render() {
    const { likes, dislikes, action } = this.state;

    const actions = [
      <span key="like">
        <CPTooltip title={tooltips.preauth.noMatch.like}>
          {action === 'liked' ? <LikeFilled onClick={this.like} /> : <LikeOutlined onClick={this.like} />}
        </CPTooltip>
        <span style={{ paddingLeft: 8, cursor: 'auto' }}>{likes}</span>
      </span>,
      <span key={tooltips.preauth.noMatch.dislike}>
        <CPTooltip title="Dislike">
          {action === 'disliked' ? (
            <DislikeFilled onClick={this.dislike} />
          ) : (
            <DislikeOutlined onClick={this.dislike} />
          )}
        </CPTooltip>
        <span style={{ paddingLeft: 8, cursor: 'auto' }}>{dislikes}</span>
      </span>,
    ];

    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <Typography.Title level={1}>Whoops! This page doesn't exist!</Typography.Title>
          <Typography.Title level={4}>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            You can{' '}
            <Link to="/" className="text-link">
              return to our homepage
            </Link>
            , or{' '}
            <a onClick={this.openIntercom} className="text-link">
              let us know
            </a>{' '}
            if you can't find what you're looking for...
          </Typography.Title>
          <div>...or meditate on the quote below.</div>
          <br />
          <div style={{ width: 600, textAlign: 'left', margin: '0 auto' }}>
            <Divider />
            <Card
              actions={actions}
              title={<a href={this.state.quote.website}>{this.state.quote.author}</a>}
              extra={<span>{this.state.quote.source}</span>}
              size="small"
            >
              <p>{this.state.quote.quote}</p>
            </Card>
          </div>
        </div>
      </PreAuthLayout>
    );
  }
}

export default NoMatch;
