import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import './index.styles.css'

function BasehubButton() {
    return (
        <>
            <div className='basehub-button-container'>
                <button className='basehub-button'>
                    <div className="button-outer">
                        <div className="button-inner">
                            <span>Build with Basehub</span>
                        </div>
                    </div>
                </button>
            </div>

        </>
    )
}

BasehubButton.Layout = DefaultLayout;
BasehubButton.Title = 'Bashub Button';
BasehubButton.Description = 'Build with Bashub Button';
BasehubButton.Tags = ['ui'];
BasehubButton.background = 'dots';

export default BasehubButton;