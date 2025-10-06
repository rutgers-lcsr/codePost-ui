// import LandingOld from './Landing.tsx';
import LandingNew from './newlanding/Landing.tsx';

const Landing = (props: any) => {
  // Set up an A/B Test
  // FIXME: Standardize this code to make a standard A/B test function
  // Commented out for now while A/B test is turned off
  // const [variant, setVariant] = useState('0');
  // const [loaded, setLoaded] = useState(false);
  //
  // useEffect(() => {
  //   const callback = (value: string) => {
  //     if (value !== undefined) {
  //       setVariant(value);
  //     }
  //     setLoaded(true);
  //   };
  //
  //   (window as any).gtag('event', 'optimize.callback', {
  //     name: 'AXIof_9-TwKggJ3Zp9wpCg',
  //     callback: callback,
  //   });
  //
  //   // in case it never gets called, load anywy
  //   setTimeout(function() {
  //     setLoaded(true);
  //   }, 1000);
  // }, []);
  //
  // if (!loaded) {
  //   return <div />;
  // }
  //
  // if (variant === '1') {
  //   return <LandingNew {...props} />;
  // }

  // return <LandingOld {...props} />;
  return <LandingNew {...props} />;
};

export default Landing;
