import React from 'react'
import { DefaultLayout } from '../../components/layouts/default-layout';
import PyramidAnimation from './ascii-pyramid';

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

function ASCIIPyramid() {
  return (
    <>
 <div className="flex w-full h-screen justify-center items-center">
      <PyramidAnimation 
      color={false}
      axis="y"
      edges={true}
      />
    </div>
    </>
  )
}

ASCIIPyramid.Layout = DefaultLayout;
ASCIIPyramid.Title = 'ASCII Pyramid';
ASCIIPyramid.Description = 'ASCII Pyramid';
ASCIIPyramid.Tags = ['ui', '3d'];
ASCIIPyramid.background = 'dots';

export default ASCIIPyramid;