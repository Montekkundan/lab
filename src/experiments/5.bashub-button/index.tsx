import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import './index.styles.css'
import { BasehubIcon } from './icon';

// reference https://codepen.io/Petr-Knoll/pen/qEBWjRV
function BasehubButton() {
    return (
        <>
            <div className='basehub-button-container'>
                <button className='basehub-button'>
                    <div className="button-outer">
                        <div className="button-inner">
                            <span>Built with Basehub</span>
                            <span>
                                <BasehubIcon />
                            </span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Tailwind version */}
            {/* <div className="w-full h-screen m-0 p-0 flex items-center justify-center text-[2rem] antialiased overflow-hidden">
                <button className="outline-none cursor-pointer bg-black/75 rounded-full relative shadow-[-0.15em_-0.15em_0.15em_-0.075em_rgba(0,0,0,0.25),0.0375em_0.0375em_0.0675em_0_rgba(255,108,2,0.15)] after:content-[''] after:absolute after:z-0 after:w-[calc(100%+0.3em)] after:h-[calc(100%+0.3em)] after:top-[-0.15em] after:left-[-0.15em] after:rounded-[inherit] after:bg-gradient-to-br after:from-black/50 after:via-transparent after:to-transparent after:blur-[0.0125em] after:opacity-25 after:mix-blend-multiply">
                    <div className="relative z-[1] rounded-[inherit] transition-shadow duration-300 will-change-[box-shadow] shadow-[0_0.05em_0.05em_-0.01em_rgba(0,0,0,1),0_0.01em_0.01em_-0.01em_rgba(0,0,0,0.5),0.15em_0.3em_0.1em_-0.01em_rgba(5,5,5,0.25)] hover:shadow-none">
                        <div className="relative z-[1] px-12 py-8 bg-gradient-to-br from-[#FF8A2A] to-[#FF6C02] transition-all duration-250 will-change-transform overflow-clip rounded-full shadow-[-0.05em_-0.05em_0.05em_0_inset_rgba(0,0,0,0.25),0_0_0.05em_0.2em_inset_rgba(255,108,2,0.2),0.025em_0.05em_0.1em_0_inset_rgba(255,108,2,0.8),0.12em_0.12em_0.12em_inset_rgba(255,108,2,0.25),-0.075em_-0.25em_0.25em_0.1em_inset_rgba(0,0,0,0.25)] hover:shadow-[0.1em_0.15em_0.05em_0_inset_rgba(0,0,0,0.75),-0.025em_-0.03em_0.05em_0.025em_inset_rgba(0,0,0,0.5),0.25em_0.25em_0.2em_0_inset_rgba(0,0,0,0.5),0_0_0.05em_0.5em_inset_rgba(255,108,2,0.15),0.12em_0.12em_0.12em_inset_rgba(255,108,2,0.25),-0.075em_-0.12em_0.2em_0.1em_inset_rgba(0,0,0,0.25)] hover:scale-[0.998] hover:ring-1 hover:ring-black/10 hover:ring-inset active:scale-[0.975]">
                            <div className="flex items-center gap-[0.2em] transition-gap duration-250 hover:gap-[0.025em]">
                                <span className="relative z-[4] tracking-[-0.05em] text-transparent bg-clip-text bg-gradient-to-br from-black to-[#323232] transition-transform duration-250 will-change-transform shadow-[0_0_0.1em_rgba(255,108,2,0.1)] select-none">Built with Basehub</span>
                                <span className="relative z-[4] transition-transform duration-250 will-change-transform">
                                    <BasehubIcon />
                                </span>
                            </div>
                        </div>
                    </div>
                </button>
            </div> */}
        </>
    )
}

BasehubButton.Layout = DefaultLayout;
BasehubButton.Title = 'Bashub Button';
BasehubButton.Description = 'Built with Bashub Button';
BasehubButton.Tags = ['ui'];
BasehubButton.background = 'dots';
BasehubButton.og = '/ogs/basehub-button.png';

export default BasehubButton;