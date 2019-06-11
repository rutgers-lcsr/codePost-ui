import { Layout } from 'antd';

import React, { useRef } from 'react';
import { animated, config, useChain, useSpring } from 'react-spring';

import { SimpleCodeBox, SimpleCodeHighlight } from './SimpleCodeBox';
import { SimpleGradeHeader } from './SimpleGradeHeader';
import { SimpleGradeMenu } from './SimpleGradeMenu';

const { Sider, Content, Header } = Layout;

function textAnimation(text: string, indexFloat: number) {
  const index = Math.round(indexFloat);
  const indexTo = index < 0 ? 0 : index >= text.length ? text.length - 1 : index;
  return text.substring(0, indexTo);
}

export default function GradeAnimation() {
  const fileRef = useRef(null);
  const commentRef = useRef(null);
  const textRef = useRef(null);
  const savedCommentRef = useRef(null);
  useChain([fileRef, commentRef, textRef, savedCommentRef]);

  // File toggle
  const { index } = useSpring({ index: 2, from: { index: 1 }, config: config.molasses, ref: fileRef });
  // Comment growth toggle
  const commentSpring = useSpring({ width: 100, from: { width: 0 }, config: config.molasses, ref: commentRef });
  // Rubric Comment Selection
  // const rubricSpring = useSpring({ width: 100, from: { width: 0 }, config: config.molasses, ref: ref2 });
  // Add rubri comment to comment
  // const addComment = useSpring({to:1, from: 1, config: config.molasses, ref:ref});
  const { length } = useSpring({ length: 20, from: { length: 0 }, config: config.molasses, ref: textRef });
  // Spring to save the comment
  // const saveSpring = useSpring({})
  const saveCommentSpring = useSpring({
    index: 1,
    from: { index: 0 },
    config: config.molasses,
    ref: savedCommentRef,
  });

  return (
    <div>
      <Layout style={{ background: '#FFFFFF' }}>
        <Sider theme="light" width={150}>
          <SimpleGradeMenu
            selectedKeys={index.interpolate((i) => {
              return [Math.round(i).toString()];
            })}
          />
        </Sider>
        <Layout>
          <Header style={{ background: '#FFFFFF', paddingLeft: 20, paddingRight: 20 }}>
            <SimpleGradeHeader
              grade={saveCommentSpring.index.interpolate((i) => {
                return Math.round(i) === 0 ? '19/20' : '17/20';
              })}
            />
          </Header>
          <Layout style={{ paddingLeft: 20, paddingRight: 20, background: '#FFFFFF' }}>
            <Content>
              <SimpleCodeHighlight top={200} left={200} width={commentSpring.width} />
              <SimpleCodeBox />
            </Content>
            <Sider theme="light">
              <animated.div>
                {length.interpolate((l) => {
                  return textAnimation('Communal Recavarren', l);
                })}
              </animated.div>
              <animated.div>
                {saveCommentSpring.index.interpolate((i) => {
                  return Math.round(i);
                })}
              </animated.div>
            </Sider>
          </Layout>
        </Layout>
      </Layout>
    </div>
  );
}
