import { model, unique, required, index, reverse, embedded } from 'spirit.io/lib/decorators';
import { ModelBase } from 'spirit.io/lib/base';

@model({ datasource: 'redis' })
export class MyModelRel extends ModelBase {
    constructor(data) {
        super(data);
    }
    p1: string
    relinv: MyModel;
    relinvs: MyModel[]
}

@model({ datasource: 'redis' })
export class MyModel extends ModelBase {
    constructor() {
        super();
    }
    @required
    @required // twice for coverage
    pString: string;

    @unique
    pNumber: number;

    @index
    pDate: Date;

    pBoolean: boolean;

    @required
    aString: Array<String>;

    aNumber: Array<number>;
    aDate: Array<Date>;
    aBoolean: Array<boolean>;

    @embedded
    rel: MyModelRel;
    rels: MyModelRel[];

    @reverse('relinv')
    inv: MyModelRel;

    @reverse('relinvs')
    invs: MyModelRel[];

    aMethod(params: any): string {
        this.pString = params.pString;
        this.save();
        return `aMethod has been called with parameters ${JSON.stringify(params)}`;
    }

    static aService(params: any): any {
        return { c: (params.a + params.b).toFixed(2) };
    }


}

