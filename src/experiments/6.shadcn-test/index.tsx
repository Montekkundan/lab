import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import { cn } from '@/lib/utils';
import { DemoCreateAccount } from './cards/create-account';
import { Button } from '@/components/ui/button';

function DemoContainer({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div
        className={cn(
          "flex items-center justify-center [&>div]:w-full",
          className
        )}
        {...props}
      />
    )
  }

function ShadcnTest() {
  return (
    <>
        <div className="items-start justify-center gap-6 rounded-lg p-8 grid lg:grid-cols-2 xl:grid-cols-3">
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          <DemoContainer>
            <DemoCreateAccount />
          </DemoContainer>

          <Button>Test</Button>
        </div>
      </div>
    </>
  )
}

ShadcnTest.Layout = DefaultLayout;
ShadcnTest.Title = 'Shadcn Test';
ShadcnTest.Description = 'Testing Shadcn UI components';
ShadcnTest.Tags = ['ui', 'shadcn'];
ShadcnTest.background = 'dots'; // Changed from 'white' to 'dots' to match dark theme

export default ShadcnTest;