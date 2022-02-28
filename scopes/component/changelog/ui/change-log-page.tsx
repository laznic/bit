import { ComponentContext } from '@teambit/component';
import { H1 } from '@teambit/documenter.ui.heading';
import { Separator } from '@teambit/design.ui.separator';
import { VersionBlock } from '@teambit/component.ui.version-block';
import classNames from 'classnames';
import { useSnaps } from '@teambit/component.ui.hooks.use-snaps';
import { MDXLayout } from '@teambit/mdx.ui.mdx-layout';
import { ExportingComponents } from '@teambit/component.instructions.exporting-components';
import { AlertCard } from '@teambit/design.ui.alert-card';
import React, { HTMLAttributes, useContext } from 'react';
import { LaneBreadcrumb, useLanesContext } from '@teambit/lanes.ui.lanes';
import { Icon } from '@teambit/evangelist.elements.icon';
import { Ellipsis } from '@teambit/design.ui.styles.ellipsis';
import styles from './change-log-page.module.scss';

type ChangeLogPageProps = {} & HTMLAttributes<HTMLDivElement>;

export function ChangeLogPage({ className }: ChangeLogPageProps) {
  const component = useContext(ComponentContext);
  const lanesContext = useLanesContext();
  const currentLane = lanesContext?.currentLane;
  const snapResult = useSnaps(component.id);
  const { loading } = snapResult;
  const { snaps } = snapResult;

  if (!snaps) return null;

  if (snaps.length === 0 && !loading) {
    return (
      <>
        {currentLane && (
          <>
            <div className={styles.lane}>
              <Icon of="lane"></Icon>
              <Ellipsis className={styles.laneName}>{currentLane.id}</Ellipsis>
            </div>
            <Separator isPresentational className={styles.separator} />
          </>
        )}
        <div className={classNames(styles.changeLogPage, className)}>
          <H1 className={styles.title}>History</H1>
          <Separator isPresentational className={styles.separatorNoChangeLog} />
          <AlertCard
            level="info"
            title="There is no change log as this component has not been exported yet.
          Learn how to export components:"
            className={styles.changeLogCard}
          >
            <MDXLayout>
              <ExportingComponents />
            </MDXLayout>
          </AlertCard>
        </div>
      </>
    );
  }

  const latestVersion = snaps[0]?.tag || snaps[0]?.hash;

  return (
    <>
      <LaneBreadcrumb lane={currentLane} />
      <Separator isPresentational />
      <div className={classNames(styles.changeLogPage, className)}>
        <H1 className={styles.title}>History</H1>
        <Separator isPresentational className={styles.separator} />
        {snaps.map((snap, index) => {
          const isLatest = latestVersion === snap.tag || latestVersion === snap.hash;
          return <VersionBlock key={index} componentId={component.id.fullName} isLatest={isLatest} snap={snap} />;
        })}
      </div>
    </>
  );
}
