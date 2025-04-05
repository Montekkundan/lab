import Link from 'next/link'
import { FC } from 'react'

import s from './experiments-section.module.css'

type Experiment = {
  filename: string
  title: string
  href: string
  tags?: string[]
  number?: number
  og?: string | null
  contributors?: Array<{
    name: string
    avatar: string
    url: string
  }>
}

export type ExperimentsSectionProps = {
  experiments: Experiment[]
}

const ExperimentsSection: FC<ExperimentsSectionProps> = ({ experiments }) => (
  <>
    <h3 className={s.header}>Experiments</h3>

    <div className={s.list}>
      {experiments.map((exp) => (
        <Link
          href={exp.href}
          key={exp.filename}
          className={s.item}
        >
          <div className={s.content}>
            <div className={s.titleRow}>
              <h4 className={s.title}>{exp.title}</h4>
              <div className={s.number}>#{exp.number}</div>
            </div>

            {exp.tags && exp.tags.length > 0 && (
              <div className={s.tags}>
                {exp.tags.map((tag) => (
                  <span key={tag} className={s.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  </>
)

export default ExperimentsSection