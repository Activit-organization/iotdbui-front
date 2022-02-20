# IoTDB-UI

����Ŀ�� IoTDB-UI ��ǰ�ˣ�IoTDB-UI��һ��������ȹ���IoTDB�Ĺ���ϵͳ�����ṩ�������������ľ�ȷ���� ϣ�����ܶ���ʹ�� IoTDB ����������

## ����

Node 14.0 or above

Npm 6.0 or above

Nginx

### ����׼��

����Ŀ��Ŀ¼ִ��:

```bash
npm install
```

�԰�װ `node_modules`

### ���ýű�

��Ŀ�ṩ��һЩ���õĽű������������������͹��� Web ��Ŀ��������ʽ���Ͳ��ԡ�����λ�ü� `package.json`�� �޸Ļ���������ű��ǰ�ȫ�ġ�

### ������Ŀ

```bash
npm run dev
```

### ������Ŀ

```bash
npm run build
```

#### ������

1. ����Ŀ��Ŀ¼ִ�� `npm install` �԰�װ
2. ����Ŀ��Ŀ¼ִ��  `npm run dev` ��������Ĭ��ʹ�� 8000 �˿�
3. ����Ŀ��Ŀ¼ִ�� `npm run build` �Թ�����ʹ�� nginx ӳ�� `/dist` �е����ݵ�һ���˿� (���� 8040)��Ȼ�� `/api/` ת����һ����ַ (���� http://localhost:8080/api/)��
```
server {
	listen		8040;
	server_name	localhost;
	location / {
		root	iotdbui-front/dist;
		index	index.html;
	}
	location /api/ {
       proxy_pass    http://localhost:8080/api/;
    }
}
```
4. ����� nginx ������ websocket ���ܣ����Ի�ø��õ��û����顣��������� websocket ���ܣ�Ҳ����Ӱ��ʹ��
5. �������������֮ǰ���õĶ˿ڣ��� http://localhost:8040/ ������ʼ���� iotdb �������ɣ�
