import { DefaultLayout } from '../../components/layouts/default-layout';
import { useEffect, useState, useRef } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';
import s from './style.module.css';
import Link from 'next/link';

const SharedLayout = () => {
  const [activeLink, setActiveLink] = useState(null);
  const [isDefaultView, setIsDefaultView] = useState(true);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setActiveLink(null));

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveLink(null);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const sliderBallVariants = {
    on: {
      x: 26,
      backgroundColor: '#ccc',
    },
    off: {
      x: 0,
      backgroundColor: '#2196F3',
    },
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
        }}
      >
        <label style={{ display: 'block', marginBottom: '4px', textAlign: 'center' }}>
          View:
        </label>
        <div
          className={s.toggle_switch}
          onClick={() => setIsDefaultView(!isDefaultView)}
        >
          <input
            type='checkbox'
            checked={isDefaultView}
            readOnly
            style={{ display: 'none' }}
          />
          <div className={s.slider}>
            <motion.span
              className={s.slider_ball}
              variants={sliderBallVariants}
              initial={false}
              animate={isDefaultView ? 'on' : 'off'}
            />
          </div>
        </div>
      </div>

      {isDefaultView ? (
        <>
          <AnimatePresence>
            {activeLink ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='pointer-events-none absolute inset-0 z-10 bg-black/20'
                />
                <div className={s.active_link}>
                  <motion.div
                    layoutId={`link_${activeLink.title}`}
                    className={s.inner}
                    ref={ref}
                    style={{ borderRadius: 12 }}
                  >
                    <div className={s.header}>
                      <motion.img
                        layoutId={`image_${activeLink.title}`}
                        height={56}
                        width={56}
                        alt='Link'
                        src={activeLink.image}
                        style={{ borderRadius: 12 }}
                      />
                      <div className={s.header_inner}>
                        <div className={s.content_wrapper}>
                          <motion.h2
                            layoutId={`heading_${activeLink.title}`}
                            className={s.link_title}
                          >
                            {activeLink.title}
                          </motion.h2>
                          <motion.p
                            layoutId={`paragraph_${activeLink.title}`}
                            className={s.link_description}
                          >
                            {activeLink.description}
                          </motion.p>
                        </div>
                        <motion.button
                          layoutId={`button_${activeLink.title}`}
                          className={s.button}
                        >
                          <Link target='_blank' href={activeLink.link}>
                            Visit
                          </Link>
                        </motion.button>
                      </div>
                    </div>
                    <p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={s.long_description}
                      transisition={{ duration: 0.1 }}
                    >
                      {activeLink.longDescription}
                    </p>
                  </motion.div>
                </div>
              </>
            ) : null}
          </AnimatePresence>
          <ul className={s.list}>
            {LINKS.map((link) => (
              <motion.li
                layoutId={`link_${link.title}`}
                key={link.title}
                onClick={() => setActiveLink(link)}
                style={{ borderRadius: 8 }}
              >
                <motion.img
                  layoutId={`image_${link.title}`}
                  height={56}
                  width={56}
                  alt='Link'
                  src={link.image}
                  style={{ borderRadius: 12 }}
                />
                <div className={s.link_wrapper}>
                  <div className={s.content_wrapper}>
                    <motion.h2
                      layoutId={`heading_${link.title}`}
                      className={s.link_title}
                    >
                      {link.title}
                    </motion.h2>
                    <motion.p
                      layoutId={`paragraph_${link.title}`}
                      className={s.link_description}
                    >
                      {link.description}
                    </motion.p>
                  </div>
                  <motion.button
                    layoutId={`button_${link.title}`}
                    className={s.button}
                  >
                    <Link target='_blank' href={link.link}>
                      Visit
                    </Link>
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {activeLink ? (
            <>
              <div className={s.overlay} />
              <div className={s.active_link}>
                <div className={s.inner} ref={ref} style={{ borderRadius: 12 }}>
                  <div className={s.header}>
                    <img
                      height={56}
                      width={56}
                      alt='Link'
                      src={activeLink.image}
                      style={{ borderRadius: 12 }}
                    />
                    <div className={s.header_inner}>
                      <div className={s.content_wrapper}>
                        <h2 className={s.link_title}>{activeLink.title}</h2>
                        <p className={s.link_description}>
                          {activeLink.description}
                        </p>
                      </div>
                      <button className={s.button}>
                        <Link target='_blank' href={activeLink.link}>
                          Visit
                        </Link>
                      </button>
                    </div>
                  </div>
                  <p className={s.long_description}>
                    {activeLink.longDescription}
                  </p>
                </div>
              </div>
            </>
          ) : null}
          <ul className={s.list}>
            {LINKS.map((link) => (
              <li
                key={link.title}
                onClick={() => setActiveLink(link)}
                style={{ borderRadius: 8 }}
              >
                <img
                  height={56}
                  width={56}
                  alt='Link'
                  src={link.image}
                  style={{ borderRadius: 12 }}
                />
                <div className={s.link_wrapper}>
                  <div className={s.content_wrapper}>
                    <h2 className={s.link_title}>{link.title}</h2>
                    <p className={s.link_description}>{link.description}</p>
                  </div>
                  <button className={s.button}>
                    <Link target='_blank' href={link.link}>
                      Visit
                    </Link>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};

const LINKS = [
  {
    title: 'Next.js',
    description: 'The React Framework for the Web',
    link: 'https://nextjs.org',
    longDescription:
      'The React Framework for the Web',
    image: '/images/nextjs.jpg',
  },
  {
    title: 'Threejs',
    description: 'Course by Bruno Simon.',
    link: 'https://threejs-journey.com/',
    longDescription:
      'Best course to learn Three.js.',
    image: '/images/threejs.png',
  },
  {
    title: 'Animation',
    description: 'Course by Emil Kowalski',
    link: 'https://animations.dev/',
    longDescription:
      'Best course to learn web animations.',
    image: '/images/animations.png',
  },
  {
    title: 'Framer Motion',
    description: 'Simple yet powerful motion library for React',
    link: 'https://www.framer.com/motion/introduction/',
    longDescription:
      'Best library to create animations in React.',
    image: '/images/framer.jpg',
  },
];

SharedLayout.Layout = DefaultLayout;

SharedLayout.Title = 'Shared layout';
SharedLayout.Description = (
  <p>
    This is an example of a shared layout. When you click on a link, it will
    expand and show more information about it. You can also toggle between the
    default view and the shared layout view.
  </p>
)
SharedLayout.Tags = ['framer motion', 'animation'];
SharedLayout.background = "dots"

export default SharedLayout;
