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

function Knot() {
  return (
    <>
 <div className="flex w-full h-screen justify-center items-center">
      <KnotAnimation />
    </div>
    </>
  )
}

Knot.Layout = DefaultLayout;
Knot.Title = 'Knot';
Knot.Description = 'Knot';
Knot.Tags = ['ui', '3d'];
Knot.background = 'dots';

export default Knot;