// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Layout } from 'antd';

import { useState } from 'react';
import { animated, config, useChain, useSpring, useSpringRef } from 'react-spring';

import { exampleCode1, SimpleCodeBox, SimpleCodeHighlight } from './SimpleCodeBox';
import { SimpleComment } from './SimpleComments';

import { SimpleGradeHeader } from './SimpleGradeHeader';
import { getFileItem, SimpleGradeMenu } from './SimpleGradeMenu';

import cursorImg from './cursor.png';

const { Sider, Content, Header } = Layout;

function textAnimation(text: string, indexFloat: number) {
  const index = Math.round(indexFloat);
  const indexTo = index < 0 ? 0 : index > text.length ? text.length : index;
  return text.substring(0, indexTo);
}

const AnimatedComment = animated(SimpleComment);

function GradeAnimation() {
  const commentRef = useSpringRef();
  const commentBoxRef = useSpringRef();
  const textRef = useSpringRef();
  const savedCommentRef = useSpringRef();
  const deleteCommentRef = useSpringRef();
  // const delayRef = useRef(null);

  const [refs] = useState([commentRef, commentBoxRef, textRef, savedCommentRef, deleteCommentRef]);
  // const [counter, setCounter] = useState(0);
  // Comment growth toggle
  const commentSpring = useSpring({
    width: 102,
    from: { width: 0 },
    delay: 2000,
    ref: commentRef,
  });
  // Comment creation
  const commentBoxSpring = useSpring({
    width: 230,
    opacity: 1,
    from: { width: 0, opacity: 0 },
    config: config.slow,
    ref: commentBoxRef,
  });
  // Text input
  const { length } = useSpring({
    length: 90,
    from: { length: 0 },
    config: { duration: 3500 },
    ref: textRef,
  });
  // Spring to save the comment
  const saveCommentSpring = useSpring({
    index: 1,
    from: { index: 0 },
    config: config.molasses,
    ref: savedCommentRef,
  });
  // Spring to delete comment
  const deleteCommentSpring = useSpring({
    index: 1,
    from: { index: 0 },
    config: config.molasses,
    delay: 1000,
    ref: deleteCommentRef,
  });

  useChain(refs);

  useChain(refs);

  // A shadow to show the user that the save button is being clicked on
  const saveShadow = (
    <animated.div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        top: 175,
        left: 153,
        zIndex: 2,
        background: 'grey',
        position: 'absolute',
        opacity: saveCommentSpring.index.to({ range: [0.0, 0.25, 0.5, 1], output: [0.0, 0.25, 0.0, 0.0] }),
      }}
    />
  );

  // A shadow to show the user that the save button is being clicked on
  const deleteShadow = (
    <animated.div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        top: 170,
        left: 178,
        zIndex: 2,
        background: 'red',
        position: 'absolute',
        opacity: deleteCommentSpring.index.to({ range: [0.0, 0.25, 0.5, 1], output: [0.0, 0.25, 0.0, 0.0] }),
      }}
    />
  );

  return (
    <div>
      <Layout style={{ maxWidth: 840 }}>
        <Sider theme="light" width={150} style={{ background: '#FFFFFF' }}>
          <SimpleGradeMenu
            selectedKeys={['2']}
            secondFileDeduction={getFileItem('file2.java', -1)}
          />
        </Sider>
        <Layout style={{ maxWidth: 690 }}>
          <Header style={{ background: '#FFFFFF', paddingLeft: 20, paddingRight: 20 }}>
            <SimpleGradeHeader
              grade={saveCommentSpring.index.to((i: number) => {
                return Math.round(i) === 0 ? '20/20' : '19/20';
              })}
            />
          </Header>
          <Layout style={{ padding: 20 }}>
            <Content>
              <SimpleCodeHighlight top={166} left={360} width={commentSpring.width} />
              <animated.div
                style={{
                  top: 164,
                  left: commentSpring.width.to((x: number) => {
                    return Number(x) + 350;
                  }),
                  opacity: commentSpring.width.to((x: number) => {
                    return x === 0 || x === 102 ? 0 : 1;
                  }),
                  position: 'absolute',
                }}
              >
                <img src={cursorImg} style={{ width: 24 }} />
              </animated.div>
              <SimpleCodeBox code={exampleCode1} />
            </Content>
            <Sider width={250} style={{ background: 'rgba(0,0,0,0)' }}>
              {saveShadow}
              {deleteShadow}
              <div style={{ position: 'absolute', top: 55 }}>
                <div style={{ position: 'relative' }}>
                  <animated.div
                    id="animation"
                    style={{
                      position: 'relative',
                      width: 230,
                      minWidth: 230,
                      height: 160,
                      opacity: commentBoxSpring.opacity,
                      overflowX: 'hidden',
                      transform: commentBoxSpring.opacity.to((x: number) => {
                        return `translateY(${Number(x) * 30 - 30}px)`;
                      }),
                      display: 'inline-block',
                    }}
                  >
                    <div style={{ position: 'absolute', float: 'left' }}>
                      <div style={{ minWidth: 230, minHeight: 250, width: 230, position: 'absolute' }}>
                        <AnimatedComment
                          text={length.to((l: number) => {
                            return textAnimation(
                              '*Variable naming*: How about `arr` and `el` instead of `x` and `y`?',
                              l,
                            );
                          })}
                          line={3}
                          points={1}
                          top={0}
                          classType={saveCommentSpring.index.to((x: number) => {
                            return Math.round(x) === 1 ? 'inactive' : 'active';
                          })}
                        />
                      </div>
                    </div>
                  </animated.div>
                </div>
              </div>
            </Sider>
          </Layout>
        </Layout>
      </Layout>
    </div>
  );
}

export default GradeAnimation;
