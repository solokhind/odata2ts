import { DateString, DateTimeOffsetString, TimeOfDayString } from "./odata/ODataTypes";
import { QDatePath } from "./path/date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "./path/date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./path/date-time-v4/QTimeOfDayPath";
import { QBooleanPath } from "./path/QBooleanPath";
import { QEntityCollectionPath } from "./path/QEntityCollectionPath";
import { QEntityPath } from "./path/QEntityPath";
import { QNumberPath } from "./path/QNumberPath";
import { QPath } from "./path/QPathModel";
import { QStringPath } from "./path/QStringPath";
import { QEntityModel } from "./QEntityModel";

/**
 * Helper function to "unpack" an array type; leaves non-arrays untouched.
 * => Unpack = Array<T> becomes T
 */
type Unpacked<T> = T extends (infer U)[] ? U : T;

export type QRawPropContainer<TypeModel> = {
  [Property in keyof TypeModel]: TypeModel[Property] extends DateString
    ? typeof QDatePath
    : TypeModel[Property] extends TimeOfDayString
    ? typeof QTimeOfDayPath
    : TypeModel[Property] extends DateTimeOffsetString
    ? typeof QDateTimeOffsetPath
    : TypeModel[Property] extends Boolean
    ? typeof QBooleanPath
    : TypeModel[Property] extends Number
    ? typeof QNumberPath
    : TypeModel[Property] extends string
    ? typeof QStringPath
    : TypeModel[Property] extends Array<any>
    ? [typeof QEntityCollectionPath, () => QEntityModel<Unpacked<TypeModel[Property]>, any>]
    : [typeof QEntityPath, () => QEntityModel<TypeModel[Property], any>];
};

export class QEntityFactory {
  /**
   * Factory function to create a QEntity based on a given type (TypeModel) in a type-safe manner.
   * Possible properties are checked via automatic type mapping.
   *
   * @param collectionPath OData path to the entity collection
   * @param props mapped QPath constructors or for QEntityPath and QEntityCollectionPath tuples [QEntityPath, QObject]
   * @returns
   */
  static create<TypeModel, KeyModel extends keyof TypeModel>(
    collectionPath: string,
    props: QRawPropContainer<Required<TypeModel>>
  ): QEntityModel<TypeModel, KeyModel> {
    const result = Object.entries(props).reduce((collector, [name, constructorOrTuple]) => {
      if (typeof constructorOrTuple === "function") {
        // @ts-ignore
        collector[name] = new constructorOrTuple(name);
      } else if (typeof constructorOrTuple === "object") {
        // @ts-ignore
        const [construct, entityFn] = constructorOrTuple;
        collector[name] = new construct(name, entityFn);
      } else {
        throw Error("Unknown type has been passed!");
      }
      return collector;
    }, {} as { [key: string]: QPath });

    return {
      __collectionPath: collectionPath,
      ...result,
    } as QEntityModel<TypeModel, KeyModel>;
  }
}
