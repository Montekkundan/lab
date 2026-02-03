import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import { cn } from '@/lib/utils';
import { DemoCreateAccount } from './cards/create-account';

function DemoContainer({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div
        className={cn(
          "flex items-center justify-center w-full",
          className
        )}
        {...props}
      />
    )
  }

function ShadcnTest() {
  return (
    <>
        <div className="flex items-center justify-center p-8">
          <DemoContainer>
            <DemoCreateAccount />
          </DemoContainer>
      </div>
    </>
  )
}

ShadcnTest.Layout = DefaultLayout;
ShadcnTest.Title = 'Shadcn Test';
ShadcnTest.Description = 'Testing Shadcn UI components';
ShadcnTest.Tags = ['ui', 'shadcn'];
ShadcnTest.background = 'dots';

export default ShadcnTest;