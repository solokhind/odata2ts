import { QEntityModel, QStringPath } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderBase, ODataUriBuilderConfig } from "./internal";

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
export class ODataUriBuilder<T, K extends keyof T> extends ODataUriBuilderBase<T> {
  /**
   * Create an UriBuilder by passing in a query object, which already contains the base path
   * to the OData service & the given entity.
   *
   * Example:
   * ODataUriBuilder.create(qPerson)
   *   .select(...)
   *   .filter(qPerson.age.greateThan(...))
   *   ...
   *   .build()
   *
   * @param qEntity the query object
   * @param config optionally pass a configuration
   * @returns a UriBuilder
   */
  static create<T, K extends keyof T>(qEntity: QEntityModel<T, K>, config?: ODataUriBuilderConfig) {
    return new ODataUriBuilder<T, K>(qEntity, config);
  }

  protected readonly entity: QEntityModel<T, K>;
  private key?: string;

  private constructor(qEntity: QEntityModel<T, K>, config?: ODataUriBuilderConfig) {
    super(qEntity, config);
    this.entity = qEntity;
  }

  /**
   * Get a specific entity by its key / id.
   *
   * @param keys the key object
   * @returns this query builder
   */
  public byKey(keys: { [Key in K]: T[Key] }) {
    this.key = Object.entries<T[K]>(keys)
      .map(([key, value]) => {
        const prop = this.entity[key as K];
        const val = prop && prop instanceof QStringPath ? `'${value}'` : value;
        return key + "=" + val;
      })
      .join(",");

    return this;
  }

  /**
   * Add the count to the response.
   *
   * @param doCount explicitly specify if counting should be done
   * @returns this query builder
   */
  public count(doCount?: boolean) {
    this.itemsCount = doCount === undefined || doCount;
    return this;
  }

  /**
   * Build the final URI string.
   *
   * @returns the query string including the base service & collection path
   */
  public build(): string {
    const paramFn = this.unencoded ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);
    const collection = this.entity.__collectionPath + (this.key ? `(${this.key})` : "");

    return "/" + collection + (params.length ? `?${params.join("&")}` : "");
  }
}
