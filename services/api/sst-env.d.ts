/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    Accounts: {
      name: string
      type: "sst.aws.Dynamo"
    }
    AuthSecret: {
      type: "sst.sst.Secret"
      value: string
    }
    Database: {
      name: string
      type: "sst.aws.Dynamo"
    }
  }
}
export {}