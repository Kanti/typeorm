import { AnyDriver } from "../driver"
import {
  EntityCoreSelection,
  FindOptions,
  FindOptionsMany,
  FindReturnType,
} from "../options"
import { FindOptionsCount } from "../options/find-options/find-options-count"
import {
  AnyEntity,
  AnyEntityCore,
  EntityInstance,
  EntityReference,
  ReferencedEntity,
} from "./entity-core"
import { EntityRelationReferencedColumnTypeMap } from "./entity-referenced-columns"
import {
  EntityRelationManyToManyNotOwner,
  EntityRelationManyToManyOwner,
  EntityRelationManyToOne,
  EntityRelationOneToMany,
  EntityRelationOneToOneNotOwner,
  EntityRelationOneToOneOwner,
} from "./entity-relations"

export type EntityPropsMode = "all" | "create" | "virtuals"

export type ArrayRelations<
  Entity extends AnyEntity
> = Entity extends AnyEntityCore
  ? {
      [P in keyof Entity["relations"] as Entity["relations"][P] extends EntityRelationManyToManyOwner<EntityReference>
        ? P
        : Entity["relations"][P] extends EntityRelationManyToManyNotOwner<EntityReference>
        ? P
        : Entity["relations"][P] extends EntityRelationOneToMany<EntityReference>
        ? P
        : never]: Entity["relations"][P]
    }
  : {
      [P in keyof Entity as Entity[P] extends Array<any> ? P : never]: Entity[P]
    }

export type NonArrayRelations<
  Entity extends AnyEntity
> = Entity extends AnyEntityCore
  ? {
      [P in keyof Entity["relations"] as Entity["relations"][P] extends EntityRelationOneToOneOwner<EntityReference>
        ? P
        : Entity["relations"][P] extends EntityRelationOneToOneNotOwner<EntityReference>
        ? P
        : Entity["relations"][P] extends EntityRelationManyToOne<EntityReference>
        ? P
        : never]: Entity["relations"][P]
    }
  : {
      [P in keyof Entity as Entity[P] extends Array<any> ? never : P]: Entity[P]
    }

export type ActiveRecordMethods<
  Driver extends AnyDriver,
  Entity extends AnyEntityCore
> = Entity["type"] extends "active-record"
  ? {
      save(): Promise<void>
      remove(): Promise<void>
      archive(): Promise<void>
      unarchive(): Promise<void>
      reload(): Promise<void>
    } & {
      [P in keyof ArrayRelations<Entity> as `load${Capitalize<string & P>}`]: <
        Options extends FindOptionsMany<Driver, Entity>
      >(
        options?: Options,
      ) => Promise<
        FindReturnType<
          Driver,
          ReferencedEntity<
            Entity,
            P extends keyof Entity["relations"] ? P : never
          >,
          Options["select"] extends EntityCoreSelection<Entity>
            ? Options["select"]
            : {},
          false,
          "all"
        >[]
      >
    } &
      {
        [P in keyof NonArrayRelations<Entity> as `load${Capitalize<
          string & P
        >}`]: <Options extends FindOptions<Driver, Entity>>(
          options?: Options,
        ) => Promise<
          FindReturnType<
            Driver,
            ReferencedEntity<
              Entity,
              P extends keyof Entity["relations"] ? P : never
            >,
            Options["select"] extends EntityCoreSelection<Entity>
              ? Options["select"]
              : {},
            false,
            "all"
          >
        >
      } &
      {
        [P in keyof ArrayRelations<Entity> as `count${Capitalize<
          string & P
        >}`]: <Options extends FindOptionsCount<Driver, Entity>>(
          options?: Options,
        ) => Promise<number>
      } &
      {
        [P in keyof ArrayRelations<Entity> as `has${Capitalize<string & P>}`]: (
          entities: P extends keyof Entity["relations"]
            ? EntityRelationReferencedColumnTypeMap<
                Driver,
                ReferencedEntity<Entity, P>,
                Entity["relations"][P]
              >
            : never,
        ) => Promise<boolean>
      } &
      {
        [P in keyof ArrayRelations<Entity> as `add${Capitalize<string & P>}`]: (
          entities: P extends keyof Entity["relations"]
            ? EntityRelationReferencedColumnTypeMap<
                Driver,
                ReferencedEntity<Entity, P>,
                Entity["relations"][P]
              >
            : never,
        ) => Promise<void>
      } &
      {
        [P in keyof ArrayRelations<Entity> as `remove${Capitalize<
          string & P
        >}`]: (
          entities: P extends keyof Entity["relations"]
            ? EntityRelationReferencedColumnTypeMap<
                Driver,
                ReferencedEntity<Entity, P>,
                Entity["relations"][P]
              >
            : never,
        ) => Promise<void>
      }
  : {}

export type EntityPropsWithModel<
  Driver extends AnyDriver,
  Entity extends AnyEntity,
  PropsMode extends EntityPropsMode
> = Entity extends AnyEntityCore
  ? PropsMode extends "all"
    ? EntityProps<Entity> &
        {
          [P in keyof Entity["model"]["type"]]: {
            type: "model"
            property: P
          }
        } &
        {
          [P in keyof Entity["virtualMethods"]]: {
            type: "virtualMethods"
            property: P
          }
        } &
        {
          [P in keyof Entity["virtualLazyProperties"]]: {
            type: "virtualLazyProperties"
            property: P
          }
        } &
        {
          [P in keyof Entity["virtualEagerProperties"]]: {
            type: "virtualEagerProperties"
            property: P
          }
        } &
        ActiveRecordMethods<Driver, Entity>
    : PropsMode extends "virtuals"
    ? {
        [P in keyof Entity["virtualMethods"]]: {
          type: "virtualMethods"
          property: P
        }
      }
    : EntityProps<Entity> &
        {
          [P in keyof Entity["model"]["type"]]: {
            type: "model"
            property: P
          }
        }
  : {
      [P in keyof Entity]: {
        type: "class-property"
        property: P
      }
    }

export type EntityProps<Entity extends AnyEntity> = Entity extends AnyEntityCore
  ? {
      [P in keyof Entity["columns"]]: {
        type: "column"
        property: P
      }
    } &
      {
        [P in keyof Entity["relations"]]: {
          type: "relation"
          property: P
        }
      } &
      {
        [P in keyof Entity["embeds"]]: {
          type: "embed"
          property: P
        }
      }
  : Entity extends EntityInstance
  ? {
      [P in keyof Entity]: {
        type: "class-property"
        property: P
      }
    }
  : unknown