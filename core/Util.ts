/**
 * util modules
 * **/

    /**
     * Reserved Data files
     if there are multiple records use items node
     string kind?;
     string fields?;
     string etag?;
     string id?;
     string lang?;
     string updated?; # date formatted RFC 3339
     boolean deleted?;
     integer currentItemCount?;
     integer itemsPerPage?;
     integer startIndex?;
     integer totalItems?;
     integer pageIndex?;
     integer totalPages?;
     string pageLinkTemplate /^https?:/ ?;
     object {}* next?;
     string nextLink?;
     object {}* previous?;
     string previousLink?;
     object {}* self?;
     string selfLink?;
     object {}* edit?;
     string editLink?;
     array [
     object {}*;
     "data": {
             "items": [
             {  Object #1
     */

   class JsonRes {
        private _schema = {
            api_version: 'v1.0',
            context: '',
            //unique response id good for debugging
            id: '',
            //method that being called e.g 'user.delete'
            method: '',
            /* Payload that's been sent */
            params: {},
            data: null,
            error: {
                //Http response code eg. 500
                code: 500,
                message: '',
                //a broad context of where the error is found e.g Add user
                // domain: '',
                //unique error code can be used for i18n translation eg. error.user.not_found
                // reason: '',
                //human readable error message eg. User not found
                // errors: null
            }
        }
        private _res

        // constructor(success: boolean, obj: any, statusCode: number = 500) {
        //      return success ?this.success(obj, statusCode): this.fail(obj, statusCode)
        // }
        constructor(res: any) {
            this._res = res
        }

        //Response object from node
        /**
         * Success json response
         * @param data
         */
        public success(obj?, statusCode: number = 200) {
            let _schema = this._schema
            this._res.status(statusCode)
            delete _schema.error
            _schema.data = obj
            this._res.json(_schema)
        }

        /**
         * Fail
         * @param statusCode:Number
         * @param code
         */
        public fail(obj?, statusCode = 500) {
            // set http status code
            this._res.status(statusCode)
            let _schema = this._schema
            console.log(obj.message)
            delete _schema.data
            _schema.error.message = obj.message
            if (obj.code)
                _schema.error.code = obj.code
            if (obj.reason)
                _schema.error.reason = obj.reason
            if (obj.errors)
                _schema.error.errors = obj.errors
            _schema.error.code = statusCode

            return this._res.json(_schema)
        }
    }




export {JsonRes}
