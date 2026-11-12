import type { FC } from "react";
import { Badge, Form, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import {
  CalendarEvent,
  LockFill,
  PencilFill,
  ShieldFillExclamation,
  ShieldLockFill,
} from "react-bootstrap-icons";
import { IconButton } from "@/shared/components/IconButton";
import {
  type Configuration,
  valueKindOf,
} from "../domain/Entity/Configuration";
import { categoryLabel } from "../domain/Entity/ConfigurationCategory";
import {
  formatUtc,
  type ScheduledChange,
} from "../domain/Entity/ScheduledChange";
import type { useConfigurationList } from "../hooks/useConfigurationList";

// The group of a setting, by the start of its key, then by its category
const GROUPS_BY_PREFIX: [string, string][] = [
  ["security.password", "Password Security Policy"],
  ["security.mfa", "Multi-Factor Authentication (MFA)"],
  ["notification.smtp", "SMTP Email Server Settings"],
  ["general.auth", "Authentication Provider Settings"],
];
const GROUPS_BY_CATEGORY = new Map([
  ["general", "General Application Settings"],
  ["security", "General Security Settings"],
  ["notification", "General Notification Settings"],
  ["env", "Environment Settings"],
]);

const groupNameOf = (config: Configuration): string =>
  GROUPS_BY_PREFIX.find(([prefix]) => config.key.startsWith(prefix))?.[1] ??
  GROUPS_BY_CATEGORY.get(config.category) ??
  `${categoryLabel(config.category)} Settings`;

const lockedLabel = (config: Configuration) =>
  config.isReadOnly
    ? "This setting is read-only"
    : "This setting is locked until a second-factor check is available";

/** What the rows of the table read and change on the page. */
export interface ConfigurationRowContext {
  modifiedKeys: string[];
  saveFailures: Record<string, string>;
  plannedByKey: Map<string, ScheduledChange>;
  canUpdate: boolean;
  isUpdating: boolean;
  setLocalValue: ReturnType<typeof useConfigurationList>["setLocalValue"];
  onEdit: (config: Configuration) => void;
  onSchedule: (config: Configuration, change?: ScheduledChange) => void;
}

interface RowProps {
  config: Configuration;
  context: ConfigurationRowContext;
}

const TypeBadges: FC<{ config: Configuration }> = ({ config }) => (
  <div className="mt-2 d-flex gap-2">
    <Badge bg="light" className="text-dark border text-uppercase">
      {config.type}
    </Badge>
    {config.requiresMfa ? (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>
            Changing this setting needs a second-factor check, which is not
            available yet.
          </Tooltip>
        }
      >
        <Badge bg="warning" className="text-dark">
          <ShieldLockFill className="me-1" />
          LOCKED
        </Badge>
      </OverlayTrigger>
    ) : null}
    {config.isApplied === false && (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>
            Saved, but no service reads this setting yet: changing it has no
            effect.
          </Tooltip>
        }
      >
        <Badge bg="secondary">NOT APPLIED YET</Badge>
      </OverlayTrigger>
    )}
  </div>
);

const KeyCell: FC<RowProps> = ({ config, context }) => {
  const isModified = context.modifiedKeys.includes(config.key);
  const saveFailure = context.saveFailures[config.key];
  const planned = context.plannedByKey.get(config.key);
  return (
    <td>
      <div className="d-flex align-items-center flex-wrap gap-2">
        <span className="fw-bold">{config.key}</span>
        {isModified && (
          <Badge bg="warning" className="text-dark small">
            UNSAVED
          </Badge>
        )}
        {planned && (
          <Badge bg="info" className="text-dark small">
            CHANGE PLANNED
          </Badge>
        )}
      </div>
      {saveFailure && isModified ? (
        <div className="text-danger small mt-1" role="alert">
          Not saved: {saveFailure}
        </div>
      ) : null}
      {config.description ? (
        <div className="text-muted small mt-1">{config.description}</div>
      ) : null}
      <TypeBadges config={config} />
    </td>
  );
};

const SwitchValue: FC<RowProps & { isLocked: boolean }> = ({
  config,
  context,
  isLocked,
}) => (
  <div className="d-flex align-items-center gap-2">
    <Form.Check
      type="switch"
      id={`toggle-${config.key}`}
      checked={Boolean(config.value)}
      disabled={isLocked || context.isUpdating}
      onChange={(e) => context.setLocalValue(config.key, e.target.checked)}
      aria-label={`Toggle setting ${config.key}`}
    />
    <Badge bg={config.value ? "success" : "secondary"}>
      {config.value ? "ENABLED" : "DISABLED"}
    </Badge>
  </div>
);

const FieldValue: FC<{ config: Configuration }> = ({ config }) => (
  <span className="text-dark fw-medium">
    {String(config.value)}
    {config.accepts?.unit ? (
      <span className="text-muted fw-normal"> {config.accepts.unit}</span>
    ) : null}
  </span>
);

const ValueCell: FC<RowProps & { isLocked: boolean }> = (props) => {
  const { config } = props;
  // A secret is masked, whatever its type
  const cell = config.isSecret ? "secret" : valueKindOf(config.type);
  return (
    <td>
      {cell === "secret" && (
        <span className="text-muted">
          <LockFill className="text-warning me-1" />
          <code>********</code>
        </span>
      )}
      {cell === "switch" && <SwitchValue {...props} />}
      {cell === "json" && (
        <pre
          className="m-0 bg-light p-2 rounded border small text-secondary"
          style={{ fontSize: "0.8rem", maxHeight: "150px" }}
        >
          {JSON.stringify(config.value, null, 2)}
        </pre>
      )}
      {cell === "field" && <FieldValue config={config} />}
    </td>
  );
};

const LockedAction: FC<{ config: Configuration }> = ({ config }) => (
  <OverlayTrigger
    placement="top"
    overlay={<Tooltip>{lockedLabel(config)}</Tooltip>}
  >
    <IconButton
      size="sm"
      variant="outline-secondary"
      disabled
      label={lockedLabel(config)}
      icon={<ShieldFillExclamation className="text-muted" />}
    />
  </OverlayTrigger>
);

const ActionsCell: FC<RowProps & { isLocked: boolean }> = (props) => {
  const { config, context, isLocked } = props;
  const planned = context.plannedByKey.get(config.key);
  // A setting users notice may change at a later date
  const canSchedule =
    context.canUpdate && !isLocked && config.announcement !== undefined;
  return (
    <td className="text-center">
      {isLocked ? (
        <LockedAction config={config} />
      ) : (
        <div className="d-flex justify-content-center gap-1">
          <IconButton
            size="sm"
            variant="primary"
            disabled={context.isUpdating}
            onClick={() => context.onEdit(config)}
            label="Edit setting"
            icon={<PencilFill />}
          />
          {canSchedule ? (
            <IconButton
              size="sm"
              variant="outline-primary"
              disabled={context.isUpdating}
              onClick={() => context.onSchedule(config, planned)}
              label={
                planned
                  ? `Edit the change planned for ${formatUtc(planned.dueAt)}`
                  : "Schedule a change"
              }
              icon={<CalendarEvent />}
            />
          ) : null}
        </div>
      )}
    </td>
  );
};

const ConfigurationRow: FC<RowProps> = ({ config, context }) => {
  // The server refuses a change to a key that requires MFA until it can
  // check a second factor (T-10)
  const isLocked = Boolean(config.isReadOnly || config.requiresMfa);
  return (
    <tr>
      <KeyCell config={config} context={context} />
      <ValueCell config={config} context={context} isLocked={isLocked} />
      <td>
        <Badge bg={config.environmentScope === "all" ? "primary" : "secondary"}>
          {config.environmentScope}
        </Badge>
      </td>
      <td>
        <div className="d-flex flex-wrap gap-1">
          {config.targetServices.map((service) => (
            <Badge key={service} bg="dark" className="small">
              {service}
            </Badge>
          ))}
        </div>
      </td>
      <ActionsCell config={config} context={context} isLocked={isLocked} />
    </tr>
  );
};

// The settings of a category, by group, in the order they come
const groupsOf = (configs: Configuration[]) => {
  const groups = new Map<string, Configuration[]>();
  for (const config of configs) {
    const name = groupNameOf(config);
    groups.set(name, [...(groups.get(name) ?? []), config]);
  }
  return [...groups.entries()];
};

interface ConfigurationGroupsProps {
  configs: Configuration[];
  context: ConfigurationRowContext;
}

/** The settings of one category, one table per group. */
export const ConfigurationGroups: FC<ConfigurationGroupsProps> = ({
  configs,
  context,
}) => {
  if (configs.length === 0) {
    return (
      <div className="text-center py-4 text-muted bg-light rounded border">
        No configurations found matching the criteria.
      </div>
    );
  }
  return (
    <div className="mt-2">
      {groupsOf(configs).map(([groupName, items]) => (
        <div key={groupName} className="mb-5">
          <h3 className="fs-5 fw-bold text-dark mb-3">{groupName}</h3>
          <Table striped bordered hover responsive className="align-middle">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Setting Key</th>
                <th style={{ width: "35%" }}>Value</th>
                <th style={{ width: "10%" }}>Scope</th>
                <th style={{ width: "12%" }}>Target Services</th>
                <th className="text-center" style={{ width: "8%" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((config) => (
                <ConfigurationRow
                  key={config.key}
                  config={config}
                  context={context}
                />
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  );
};
