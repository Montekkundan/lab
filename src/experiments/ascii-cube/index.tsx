import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import CubeAnimation from './ascii-cube';

// function DemoContainer({
//     className,
//     ...props
//   }: React.HTMLAttributes<HTMLDivElement>) {
//     return (
//       <div
//         className={cn(
//           "flex items-center justify-center w-full",
//           className
//         )}
//         {...props}
//       />
//     )
//   }

function ASCIICube() {
  return (
    <>
 <div className="flex w-full h-screen justify-center items-center">
      <CubeAnimation />
    </div>
    </>
  )
}

ASCIICube.Layout = DefaultLayout;
ASCIICube.Title = 'ASCII Cube';
ASCIICube.Description = 'ASCII Cube';
ASCIICube.Tags = ['ui', '3d'];
ASCIICube.background = 'dots';

export default ASCIICube;