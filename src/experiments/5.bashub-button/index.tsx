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
        </>
    )
}

BasehubButton.Layout = DefaultLayout;
BasehubButton.Title = 'Bashub Button';
BasehubButton.Description = 'Built with Bashub Button';
BasehubButton.Tags = ['ui'];
BasehubButton.background = 'dots';

export default BasehubButton;