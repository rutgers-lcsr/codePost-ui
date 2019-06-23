import { Layout } from 'antd';

import React, { useRef, useState } from 'react';
import { animated, config, useChain, useSpring } from 'react-spring';

import useWindowSize from '../../../core/useWindowSize';

import { exampleCode1, SimpleCodeBox, SimpleCodeHighlight } from './SimpleCodeBox';
import { SimpleComment } from './SimpleComments';

import { SimpleGradeHeader } from './SimpleGradeHeader';
import { SimpleGradeMenu } from './SimpleGradeMenu';

const { Sider, Content, Header } = Layout;

function textAnimation(text: string, indexFloat: number) {
  const index = Math.round(indexFloat);
  const indexTo = index < 0 ? 0 : index > text.length ? text.length : index;
  return text.substring(0, indexTo);
}

function GradeAnimation() {
  const commentRef = useRef(null);
  const commentBoxRef = useRef(null);
  const textRef = useRef(null);
  const savedCommentRef = useRef(null);
  const deleteCommentRef = useRef(null);
  // const delayRef = useRef(null);

  const [refs] = useState([commentRef, commentBoxRef, textRef, savedCommentRef, deleteCommentRef]);
  // const [counter, setCounter] = useState(0);
  // Comment growth toggle
  const commentSpring = useSpring({
    width: 110,
    from: { width: 0 },
    delay: 2000,
    ref: commentRef,
  });
  // Comment creation
  const commentBoxSpring = useSpring({
    width: 250,
    opacity: 1,
    from: { width: 0, opacity: 0 },
    config: config.slow,
    ref: commentBoxRef,
  });
  // Text input
  const { length } = useSpring({
    length: 37,
    from: { length: 0 },
    config: config.molasses,
    ref: textRef,
  });
  // Spring to save the comment
  const saveCommentSpring = useSpring({
    index: 1,
    from: { index: 0 },
    config: config.slow,
    ref: savedCommentRef,
  });
  // Spring to delete comment
  const deleteCommentSpring = useSpring({
    index: 1,
    from: { index: 0 },
    config: config.slow,
    delay: 1000,
    ref: deleteCommentRef,
  });

  // Attempts at restarting animation -------
  // set the interval to incremnet the counter
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCounter((x) => {
  //       return x === 2 ? 1 : 2;
  //     });
  //   }, 13000);
  //
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  // console.log(counter);
  // const refs = counter === 2 ? [] : [fileRef, commentRef, commentBoxRef, textRef, savedCommentRef];
  // useChain(
  //   counter % 2 === 1
  //     ? [fileRef, commentRef, commentBoxRef, textRef, savedCommentRef]
  //     : [savedCommentRef, textRef, commentBoxRef, commentRef, fileRef],
  //   counter % 2 === 1 ? [0.0, 2.0, 4.0, 6.0, 8.0] : [0, 0, 0, 0, 0],
  // );
  // File toggle

  // console.log(long);
  // const onRest1 = () => {
  //   if (refs.length === 6) {
  //     console.log('here');
  //     set1({ width: 0 });
  //     set2({ width: 0, opacity: 0 });
  //     set5({ index: 0 });
  //     setRefs([commentRef, commentBoxRef, textRef, savedCommentRef, delayRef]);
  //   } else {
  //     console.log('here1');
  //     set1({ width: 110 });
  //     set2({ width: 250, opacity: 1 });
  //     set5({ index: 1 });
  //     setRefs([fileRef, commentRef, commentBoxRef, textRef, savedCommentRef, delayRef]);
  //   }
  // };

  // const onRest1 = () => {
  //   console.log('hello');
  //   setCounter((x) => {
  //     setRefs(refs.slice().reverse());
  //     return x + 1;
  //   });
  // };

  // useSpring({
  //   index: 1,
  //   from: { index: 0 },
  //   config: 2000,
  //   ref: delayRef,
  //   onRest: onRest1,
  // });

  useChain(refs);

  const AnimatedComment = animated(SimpleComment);
  // A shadow to show the user that the save button is being clicked on
  const saveShadow = (
    <animated.div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        top: 290,
        left: 156,
        zIndex: 2,
        background: 'grey',
        position: 'absolute',
        opacity: saveCommentSpring.index.interpolate({ range: [0.0, 0.25, 0.5, 1], output: [0.0, 0.25, 0.0, 0.0] }),
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
        top: 285,
        left: 198,
        zIndex: 2,
        background: 'red',
        position: 'absolute',
        opacity: deleteCommentSpring.index.interpolate({ range: [0.0, 0.25, 0.5, 1], output: [0.0, 0.25, 0.0, 0.0] }),
      }}
    />
  );

  return (
    <div>
      <Layout style={{ maxWidth: 840 }}>
        <Sider theme="light" width={150} style={{ background: '#FFFFFF' }}>
          <SimpleGradeMenu
            selectedKeys={['2']}
            secondFileDeduction={saveCommentSpring.index.interpolate((x) => {
              return Math.round(x) * -1;
            })}
          />
        </Sider>
        <Layout style={{ maxWidth: 690 }}>
          <Header style={{ background: '#FFFFFF', paddingLeft: 20, paddingRight: 20 }}>
            <SimpleGradeHeader
              grade={saveCommentSpring.index.interpolate((i) => {
                return Math.round(i) === 0 ? '20/20' : '19/20';
              })}
            />
          </Header>
          <Layout style={{ padding: 20 }}>
            <Content>
              <SimpleCodeHighlight top={325} left={275} width={commentSpring.width} />
              <animated.div
                style={{
                  top: 325,
                  left: commentSpring.width.interpolate((x) => {
                    return Number(x) + 275;
                  }),
                  opacity: commentSpring.width.interpolate((x) => {
                    return x === 0 || x === 110 ? 0 : 1;
                  }),
                  position: 'absolute',
                }}
              >
                <img src={require('./cursor.png')} style={{ width: 24 }} />
              </animated.div>
              <SimpleCodeBox code={exampleCode1} />;
            </Content>
            <Sider width={250} style={{ background: 'rgba(0,0,0,0)' }}>
              {saveShadow}
              {deleteShadow}
              <div style={{ position: 'absolute', top: 210 }}>
                <animated.div
                  id="animation"
                  style={{
                    position: 'relative',
                    width: commentBoxSpring.width,
                    height: 120,
                    opacity: commentBoxSpring.opacity,
                    overflowX: 'hidden',
                    transform: commentBoxSpring.opacity.interpolate((x) => {
                      return `translateY(${Number(x) * 30 - 30}px)`;
                    }),
                    boxShadow: saveCommentSpring.index.interpolate((x) => {
                      return Math.round(x) === 1 ? '' : '4px 0px 8px -4px rgba(0, 0, 0, 0.15)';
                    }),
                  }}
                >
                  <div style={{ minWidth: 250, minHeight: 250, width: 250, position: 'relative' }}>
                    <AnimatedComment
                      text={length.interpolate((l) => {
                        return textAnimation('Try to name your functions better!', l);
                      })}
                      line={13}
                      points={1}
                      top={0}
                      classType={saveCommentSpring.index.interpolate((x) => {
                        return Math.round(x) === 1 ? 'inactive' : 'active';
                      })}
                    />
                  </div>
                </animated.div>
              </div>
            </Sider>
          </Layout>
        </Layout>
      </Layout>
    </div>
  );
}

const GradeAnimationVideo = (props: { width: number; height: number; controls: number }) => {
  const windowSize = useWindowSize();
  return (
    <div className="animation--grade" style={{ maxWidth: props.width, maxHeight: props.height }}>
      <video
        width={props.width}
        height={props.height}
        autoPlay
        muted
        loop
        controls={windowSize.width < props.controls ? true : false}
      >
        <source src={require('./gradeAnimation-v2.mp4')} type="video/mp4" />
      </video>
    </div>
  );
};

export { GradeAnimation, GradeAnimationVideo };
