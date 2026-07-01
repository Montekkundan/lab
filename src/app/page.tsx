import Link from "next/link"
import Image from "next/image"
import { AppTopBar } from "@/components/app-top-bar"
import { getAllExperiments } from "@/lib/experiments.server"
import styles from "./page.module.css"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export default async function Home() {
  const experiments = await getAllExperiments()

  return (
    <>
      <AppTopBar />

      <main className={styles.main}>
        <div className={styles.intro}>
          <p>
            👋 Hi there. You are on Montek&apos;s experimental corner. Here you&apos;ll
            find all kinds of creative development related stuff.
          </p>
          <p>
            Browse the experiments below or check the{" "}
            <a href="https://github.com/montekkundan/lab">source code</a>.
          </p>
        </div>

        <h2 className={styles.sectionTitle}>Experiments</h2>
        <div className={styles.grid}>
          {experiments.map((exp) => (
            <Link href={exp.href || "#"} key={exp.filename} className={styles.card} prefetch>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{exp.title}</h3>
                  <time className={styles.cardDate} dateTime={exp.createdAt}>
                    {dateFormatter.format(parseLocalDate(exp.createdAt))}
                  </time>
                </div>

                {exp.tags && exp.tags.length > 0 && (
                  <div className={styles.tags}>
                    {exp.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {exp.contributors && exp.contributors.length > 0 && (
                  <div className={styles.contributors}>
                    <div className={styles.contributorAvatars}>
                      {exp.contributors.map((contributor, index) => (
                        <div
                          key={contributor.id}
                          className={styles.contributorAvatar}
                          style={{ zIndex: (exp.contributors?.length ?? 0) - index }}
                        >
                          <Image
                            src={contributor.avatarUrl}
                            alt={contributor.name || "Contributor"}
                            width={24}
                            height={24}
                            title={contributor.name || "Contributor"}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
