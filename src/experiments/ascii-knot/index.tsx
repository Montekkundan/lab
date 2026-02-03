import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import { KnotAnimation } from './knot-animation';

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

function ASCIIKnot() {
  return (
    <>
 <div className="flex w-full h-screen justify-center items-center">
      <KnotAnimation />
    </div>
    </>
  )
}

ASCIIKnot.Layout = DefaultLayout;
ASCIIKnot.Title = 'ASCII Knot';
ASCIIKnot.Description = 'ASCII Knot';
ASCIIKnot.Tags = ['ui', '3d'];
ASCIIKnot.background = 'dots';

export default ASCIIKnot;