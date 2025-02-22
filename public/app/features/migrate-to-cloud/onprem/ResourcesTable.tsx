import { css } from '@emotion/css';
import React, { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';

import { InteractiveTable, CellProps, Stack, Text, Icon, useStyles2, Button } from '@grafana/ui';
import { getSvgSize } from '@grafana/ui/src/components/Icon/utils';
import { t } from 'app/core/internationalization';

import { useGetDashboardByUidQuery } from '../api';
import { MigrationResourceDTOMock, MigrationResourceDashboard, MigrationResourceDatasource } from '../mockAPI';

interface ResourcesTableProps {
  resources: MigrationResourceDTOMock[];
}

const columns = [
  { id: 'name', header: 'Name', cell: NameCell },
  { id: 'type', header: 'Type', cell: TypeCell },
  { id: 'status', header: 'Status', cell: StatusCell },
];

export function ResourcesTable({ resources }: ResourcesTableProps) {
  return <InteractiveTable columns={columns} data={resources} getRowId={(r) => r.uid} pageSize={15} />;
}

function NameCell(props: CellProps<MigrationResourceDTOMock>) {
  const data = props.row.original;

  return (
    <Stack direction="row" gap={2} alignItems="center">
      <ResourceIcon resource={data} />

      <Stack direction="column" gap={0}>
        {data.type === 'datasource' ? <DatasourceInfo data={data} /> : <DashboardInfo data={data} />}
      </Stack>
    </Stack>
  );
}

function getDashboardTitle(dashboardData: object) {
  if ('title' in dashboardData && typeof dashboardData.title === 'string') {
    return dashboardData.title;
  }

  return undefined;
}

function DatasourceInfo({ data }: { data: MigrationResourceDatasource }) {
  return (
    <>
      <span>{data.resource.name}</span>
      <Text color="secondary">{data.resource.type}</Text>
    </>
  );
}

// TODO: really, the API should return this directly
function DashboardInfo({ data }: { data: MigrationResourceDashboard }) {
  const { data: dashboardData } = useGetDashboardByUidQuery({
    uid: data.resource.uid,
  });

  const dashboardName = useMemo(() => {
    return (dashboardData?.dashboard && getDashboardTitle(dashboardData.dashboard)) ?? data.resource.uid;
  }, [dashboardData, data.resource.uid]);

  if (!dashboardData) {
    return (
      <>
        <span>
          <Skeleton width={250} />
        </span>
        <span>
          <Skeleton width={130} />
        </span>
      </>
    );
  }

  return (
    <>
      <span>{dashboardName}</span>
      <Text color="secondary">{dashboardData.meta?.folderTitle ?? 'Dashboards'}</Text>
    </>
  );
}

function TypeCell(props: CellProps<MigrationResourceDTOMock>) {
  const { type } = props.row.original;

  if (type === 'datasource') {
    return t('migrate-to-cloud.resource-type.datasource', 'Data source');
  }

  if (type === 'dashboard') {
    return t('migrate-to-cloud.resource-type.dashboard', 'Dashboard');
  }

  return t('migrate-to-cloud.resource-type.unknown', 'Unknown');
}

function StatusCell(props: CellProps<MigrationResourceDTOMock>) {
  const { status, statusMessage } = props.row.original;

  if (status === 'not-migrated') {
    return <Text color="secondary">{t('migrate-to-cloud.resource-status.not-migrated', 'Not yet uploaded')}</Text>;
  } else if (status === 'migrating') {
    return <Text color="info">{t('migrate-to-cloud.resource-status.migrating', 'Uploading...')}</Text>;
  } else if (status === 'migrated') {
    return <Text color="success">{t('migrate-to-cloud.resource-status.migrated', 'Uploaded to cloud')}</Text>;
  } else if (status === 'failed') {
    return (
      <Stack alignItems="center">
        <Text color="error">{t('migrate-to-cloud.resource-status.failed', 'Error')}</Text>

        {statusMessage && (
          // TODO: trigger a proper modal, probably from the parent, on click
          <Button size="sm" variant="secondary" onClick={() => window.alert(statusMessage)}>
            {t('migrate-to-cloud.resource-status.error-details-button', 'Details')}
          </Button>
        )}
      </Stack>
    );
  }

  return <Text color="secondary">{t('migrate-to-cloud.resource-status.unknown', 'Unknown')}</Text>;
}

function ResourceIcon({ resource }: { resource: MigrationResourceDTOMock }) {
  const styles = useStyles2(getIconStyles);

  if (resource.type === 'dashboard') {
    return <Icon size="xl" name="dashboard" />;
  }

  if (resource.type === 'datasource' && resource.resource.icon) {
    return <img className={styles.icon} src={resource.resource.icon} alt="" />;
  } else if (resource.type === 'datasource') {
    return <Icon size="xl" name="database" />;
  }

  return undefined;
}

function getIconStyles() {
  return {
    icon: css({
      display: 'block',
      width: getSvgSize('xl'),
      height: getSvgSize('xl'),
    }),
  };
}
